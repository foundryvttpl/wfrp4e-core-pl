Hooks.on("init", () => {
	if (!game.modules.get("babele")?.active || !game.babele) {
		console.warn("wfrp4e-core-pl | Babele is not active. Skipping Babele registration.");
		return;
	}

	game.babele.register({
		module: "wfrp4e-core-pl",
		lang: "pl",
		dir: "compendium"
	});

	class CompendiumMapping {

		constructor(entityType, mapping, tc) {
			this.mapping = foundry.utils.mergeObject(game.babele.constructor.DEFAULT_MAPPINGS[entityType], mapping || {});
			this.fields = Object.keys(this.mapping).map(key => new FieldMapping(key, this.mapping[key], tc));
		}

		map(data, translations) {
			return this.fields.reduce((m, f) => foundry.utils.mergeObject(m, f.map(data, translations)), {});
		}
		
		translateField(field, data, translations) {
			return this.fields.find(f => f.field === field)?.translate(data, translations);
		}
		
		extractField(field, data) {
			return this.fields.find(f => f.field === field)?.extractValue(field, data);
		}

		extract(data) {
			return this.fields
				.filter(f => !f.isDynamic())
				.reduce((m, f) => foundry.utils.mergeObject(m, f.extract(data)), {});
		}

		isDynamic() {
			return this.fields.map(f => f.isDynamic()).reduce((result, dynamic) => result || dynamic, false);
		}
	}

	class FieldMapping {

		constructor(field, mapping, tc) {
			this.field = field;
			this.tc = tc;
			if (typeof mapping === "object") {
				this.path = mapping["path"];
				this.converter = game.babele.converters[mapping["converter"]];
				this.dynamic = true;
			} else {
				this.path = mapping;
				this.converter = null;
				this.dynamic = false;
			}
		}

		map(data, translations) {
			const map = {};
			const value = this.translate(data, translations);
			if (value) {
				this.path.split('.').reduce((a, f, i, r) => {
					a[f] = (i < r.length - 1) ? {} : value;
					return a[f];
				}, map);
			}
			return map;
		}
		
		translate(data, translations) {
			const originalValue = this.extractValue(data);
			let value;
			if (this.converter && originalValue) {
				value = this.converter(originalValue, translations[this.field], data, this.tc, translations)
			} else {
				value = translations[this.field];
			}
			return value;
		}
		
		extractValue(data) {
			return this.path.split('.').reduce((o, k) => {
				return o && o[k];
			}, data);
		}
		
		extract(data) {
			const extract = {};
			extract[this.field] = this.extractValue(data);
			return extract;
		}
		
		isDynamic() {
			return this.dynamic;
		}
	}
	
	if (globalThis.WarhammerModuleContentHandler?.prototype) {
		Reflect.defineProperty(WarhammerModuleContentHandler.prototype, "createFolders", {
			configurable: true,
			writable: true,
			value: function(pack) {
				const module = game.modules.get(pack.metadata.packageName);
				const root = foundry.utils.deepClone(module?.flags?.folder);

				if (!root) {
				console.warn(`wfrp4e-core-pl | Missing folder flag for ${pack.metadata.packageName}`);
				return;
				}

				root.type = pack.metadata.type;
				root._id = foundry.utils.randomID();
				root.flags = {"warhammer-lib" : {source : this.module.id}};
				this.rootFolders[pack.metadata.id] = root._id;
				const data = {name: root.name};
				let packsFolderJson = game.babele.packs.get(pack.metadata.packageName + "._packs-folders");
				if (packsFolderJson) {
					root.name = packsFolderJson.translations[data.name] || root.name;
					let packFolders = pack.folders.contents.map(f => f.toObject());
					for (let f of packFolders) {
						if (!f.folder) {
							f.folder = root._id;
							f.name = pack.folders.contents.find(x => x._id == f._id).name;
						}
						foundry.utils.setProperty(f.flags, "warhammer-lib.source", this.module.id);
					}
					return CONFIG.Folder.documentClass.create(packFolders.concat(root), {keepId : true})
				} else {
					let packFolders = pack.folders.contents.map(f => f.toObject());
					for(let f of packFolders) {
						if (!f.folder) {
							f.folder = root._id;
						}
						foundry.utils.setProperty(f.flags, "warhammer-lib.source", this.module.id);
					}
					return CONFIG.Folder.documentClass.create(packFolders.concat(root), {keepId : true})
				}
			}
		});
	}


	game.babele.registerConverters({
		effects: (effects, translations) => {
			return effects.map((data) => {
				if (translations){
					const translation = translations[data.name] || translations[data.id] || translations[data._id];
					if (translation) {
						let result = foundry.utils.deepClone(data);
						result.translated = true;
						if (translation.name) {
							result.name = translation.name;
						}
						if (translation.filter) {
							result.system.transferData.filter = translation.filter;
						}
						if (translation.enableConditionScript) {
							result.system.transferData.enableConditionScript = translation.enableConditionScript;
						}
						if (translation.preApplyScript) {
							result.system.transferData.preApplyScript = translation.preApplyScript;
						}
						if (translation.scriptData) {
							for (let i = 0; i < translation.scriptData.length; i++) {
								let transScript = translation.scriptData[i];
								let script = result.system.scriptData[i];
								if (script) {
									script.label = transScript.name;
									if (transScript.hideScript) {
										script.options.hideScript = transScript.hideScript;
									}
									if (transScript.activationScript) {
										script.options.activateScript = transScript.activationScript;
									}
									if (transScript.submissionScript) {
										script.options.submissionScript = transScript.submissionScript;
									}
									script.script = transScript.script;
								}
							}
						}
						return result;
					}
				}
				return data;
			});
		},

		notes: (notes, translations) => {
			// TODO: notes on map.
			return notes.map((data) => {
				if (translations){ 
					const translation = translations[data.id] ?? translations[data._id];
					if (translation) {
						return foundry.utils.mergeObject(
							data,
							foundry.utils.mergeObject(translation, { translated: true }),
						);
					}
				}
				return data;
			});
		},
		
		tableResults: (results, translations) => {
  			return results.map(data => {
				if (translations) {
					const translation = translations[data._id] || translations[`${data.range[0]}-${data.range[1]}`];
					if (translation) {
						if (translation.name) {
							data = foundry.utils.mergeObject(data, translation, {translated: true});
						}
						else {
							data = foundry.utils.mergeObject(data, foundry.utils.mergeObject({'description': translation}, {translated: true}));
						}
					}
				}
				if (data.documentUuid) {
					const text = game.babele.translateField('name', foundry.utils.parseUuid(data.documentUuid).collection.collection, {'name': data.name});
					if (text) {
						return foundry.utils.mergeObject(data, foundry.utils.mergeObject({'name': text}, {translated: true}));
					} else {
						return data;
					}
				}
				return data;
			});
		},

		bestiary_traits: (items, translations) => {
			const translatedItems = game.babele.converters.fromPack(items, translations);
			const dynamicMapping = new CompendiumMapping("Item", null);
			const toTranslate = translatedItems.filter(x => translations[x.id] != null || translations[x._id] != null)

			for (let i = 0; i < toTranslate.length; i++) {
				const item = toTranslate[i];
				const pack = game.babele.packs.find(pack => pack.translated && pack.hasTranslation(item));
				if (pack) {
					const originalName = item.name;
					let translatedItem = pack.translations[originalName];
					if (translatedItem) {
						const translatedData = dynamicMapping.map(item, translatedItem);
						translatedItem = foundry.utils.mergeObject(item, translatedData);
						for (const e of translatedItem.effects) {
							const te = pack.translations[originalName].effects[e._id];
							if (te) {
								foundry.utils.mergeObject(e, te);
								if (te.filter) {
									e.flags.wfrp4e.applicationData.filter = te.filter;
								}
								if (te.filter) {
									e.system.transferData.filter = te.filter;
								}
								if (te.enableConditionScript) {
									e.system.transferData.enableConditionScript = te.enableConditionScript;
								}
								if (te.preApplyScript) {
									e.system.transferData.preApplyScript = te.preApplyScript;
								}
								if (e.system.scriptData && te.scriptData) {
									for (let i = 0; i < te.scriptData.length; i++) {
										let transScript = te.scriptData[i];
										let script = e.system.scriptData[i];
										if (script) {
											script.label = transScript.name;
											if (transScript.hideScript) {
												script.options.hideScript = transScript.hideScript;
											}
											if (transScript.activationScript) {
												script.options.activateScript = transScript.activationScript;
											}
											if (transScript.submissionScript) {
												script.options.submissionScript = transScript.submissionScript;
											}
											script.script = transScript.script;
										}
									}
								}
							}
						}
						if ((translations[translatedItem.id] ?? translations[translatedItem._id]).specification) {
							translatedItem.system.specification.value = (translations[translatedItem.id] ?? translations[translatedItem._id]).specification;
						}
						if ((translations[translatedItem.id] ?? translations[translatedItem._id]).tests) {
							translatedItem.system.tests.value = (translations[translatedItem.id] ?? translations[translatedItem._id]).tests;
						}
					}
				} else {
					for (const pack of game.babele.packs) {
						const props = Object.getOwnPropertyNames(pack.translations);
						const itemsToCheck = [];
						for (const prop of props) {
							if (pack.translations[prop].name == item.name) { 
								itemsToCheck.push(pack.translations[prop]);
							}
						}
						for (const itemToCheck of itemsToCheck) {
							const compendiumItem = foundry.utils.fromUuidSync(itemToCheck.sourceId);
							const compendiumItemId = compendiumItem._id ?? compendiumItem.id;
							if (compendiumItem && compendiumItem.type == item.type) {
								let translatedItem = pack.translations[compendiumItemId];
								if (translatedItem) {
									const translatedData = dynamicMapping.map(item, translatedItem);
									translatedItem = foundry.utils.mergeObject(item, translatedData);
									for (const e of translatedItem.effects) {
										const te = pack.translations[compendiumItemId].effects[e._id];
										if (te) {
											foundry.utils.mergeObject(e, te);
											if (te.filter) {
												e.flags.wfrp4e.applicationData.filter = te.filter;
											}
											if (te.filter) {
												e.system.transferData.filter = te.filter;
											}
											if (te.enableConditionScript) {
												e.system.transferData.enableConditionScript = te.enableConditionScript;
											}
											if (te.preApplyScript) {
												e.system.transferData.preApplyScript = te.preApplyScript;
											}
											if (e.system.scriptData && te.scriptData) {
												for (let i = 0; i < te.scriptData.length; i++) {
													let transScript = te.scriptData[i];
													let script = e.system.scriptData[i];
													if (script) {
														script.label = transScript.name;
														if (transScript.hideScript) {
															script.options.hideScript = transScript.hideScript;
														}
														if (transScript.activationScript) {
															script.options.activateScript = transScript.activationScript;
														}
														if (transScript.submissionScript) {
															script.options.submissionScript = transScript.submissionScript;
														}
														script.script = transScript.script;
													}
												}
											}
										}
									}
									if ((translations[translatedItem.id] ?? translations[translatedItem._id]).specification) {
										translatedItem.system.specification.value = (translations[translatedItem.id] ?? translations[translatedItem._id]).specification;
									}
									if ((translations[translatedItem.id] ?? translations[translatedItem._id]).tests) {
										translatedItem.system.tests.value = (translations[translatedItem.id] ?? translations[translatedItem._id]).tests;
									}
									break;
								}
							}
						}
					}

				}
			}
			return translatedItems;
		},
		
		templateSkills: (skills, translations) => {
			if (skills.list) {
				let result = foundry.utils.deepClone(skills);
				for (let i = 0; i < result.list.length; i++) {
					result.list[i].name = translations[i];
				}
				return result;
			}
			else if (Array.isArray(skills)) {
				return translations;
			}
			return skills;
		},

		templateTalents: (talents, translations) => {
			if (talents.list) {
				let result = foundry.utils.deepClone(talents);
				for (let i = 0; i < result.list.length; i++) {
					result.list[i].name = translations[i];
				}
				return result;
			}
			else if (Array.isArray(talents)) {
				return translations;
			}
			return talents;
		},

		templateTraits: (traits, translations) => {
			if (traits.list) {
				let result = foundry.utils.deepClone(traits);
				for (let i = 0; i < result.list.length; i++) {
					result.list[i].name = translations[i];
				}
				return result;
			}
			else if (Array.isArray(traits)) {
				return translations;
			}
			return traits;
		},

		templateTrappings: (trappings, translations) => {
			if (trappings?.options && Array.isArray(translations)) {
				const result = foundry.utils.deepClone(trappings);

				for (let i = 0; i < trappings.options.length; i++) {
					const option = trappings.options[i];
					const translated = translations.find(t => t.Id === option.id);

					if (translated?.Name) {
						result.options[i].name = translated.Name;
					}
				}

				return result;
			}
			else if (Array.isArray(trappings)) {
				return translations;
			}
			return trappings;
		},
	});
});

const FVTTCompendiumCollection = foundry.documents.collections.CompendiumCollection;

(function disableCache() {
	console.log("BABELE: Disable cache");
	FVTTCompendiumCollection.CACHE_LIFETIME_SECONDS = 1;
})();

Hooks.on("ready", () => {
	setTimeout(() => {
		console.log("BABELE: Enable cache");
		FVTTCompendiumCollection.CACHE_LIFETIME_SECONDS = 300;

		game.packs.forEach(pack => {
			if (typeof pack.clear === "function") {
				pack._flush = foundry.utils.debounce(
					pack.clear.bind(pack),
													 FVTTCompendiumCollection.CACHE_LIFETIME_SECONDS * 100
				);
			}
		});
	}, 1000);
});
