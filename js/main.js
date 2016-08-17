BigNumber.config({ DECIMAL_PLACES: 3});

var Calculator = {
	Models : {}, //Namespace for Backbone Models
	Collections : {}, //Namespace for Backbone Collections
	Views : {}, //Namespace for Backbone Views
	modifierValues: {}, //a very, very simple implemenation of a hashmap to hold modifier values
	selectedWeapons: [], //Array containing Kiranico weapon objects to be calculated
	modifierNameList: [], //Array containing all the names of active modifiers
	calcWeaponsMods: [], //Array containing all the names of active modifiers at the time of pressing the calculate button
	sharpnessValue: 0, //Either 0, 1, or 2, corresponding to sharpness +0, +1, +2
	minSharpnessValue: 5, //A value from 0-5 corresponding to the minimum level of sharpness selected, 0=red, 1=orange, etc
	maxLevelOnly: false, //Boolean value for whether the calculate function should only look at max level weapons
	critBoost: false, //Boolean value for whether the crit boost modifier is active
	blunt: false, //Boolean value for whether the blunt modifier is active
	weaponClass: "", //String containing the name of the currently selected weapon class
	specificLevelID: 0, //ID of the currently selected level for the currently selected weapon

	init : function() {
		initModels();
		initCollections();
		initViews();
		startCalculator();
	},

	//calculates the end attack and affinity values of an array of kiranico weapon objects using the modifier object passed in
	calculate: function(kiranicoWeaponArray, modifiersObject) {
		console.log("in calculate");
		var mappedWeapons = this.mapWeapons(kiranicoWeaponArray);
		var modifierArray = this.createModArray(modifiersObject);

		//for each weapon in the weapon array
		var finalWeaponValues = _.map(mappedWeapons, function(weapon) {
			var bigNumberAttack = new BigNumber(weapon.attack);
			var multiplierStorage;
			var elementModStorage = [];

			//for each modifier in the modifier array
			_.each(modifierArray, function(modifier) {
				if (modifier != null) {
					bigNumberAttack = bigNumberAttack.plus(modifier["attack"]);
					weapon.affinity += modifier["affinity"];
					if (modifier["attackMulti"] > 0) multiplierStorage = modifier["attackMulti"];

					/*
					weapon.attack += modifier[0];
					weapon.affinity += modifier[1];
					if (modifier[2]) weapon.attack = weapon.attack * modifier[2];
					*/

					//Store all the elemental modifiers in another array to deal with later
					if (modifier.element.elementType > 0) {
						elementModStorage.push(modifier);
					}
				}
			});

			//have to do multiplication last
			if (multiplierStorage) {
				bigNumberAttack = bigNumberAttack.times(multiplierStorage);
			}

			//set weapon attack to the bigNumber version.
			weapon.attack = bigNumberAttack;

			var critMultiplier = Calculator.critBoost ? .4 : .25;
			var bigNumberAttack = new BigNumber(weapon.attack.toFixed(10));
			if (weapon.phial) {
				bigNumberAttack = weapon.phial.type == "Power" ? bigNumberAttack.times(1.2) : bigNumberAttack;
			}
			if (weapon.affinity > 100) {
				weapon.affinity = 100;
			}
			var bigNumberAffinity = new BigNumber(weapon.affinity);
			var bigNumberAdjAttack = bigNumberAttack.times(critMultiplier).times(bigNumberAffinity).div(100);

			var attackNoSharpness = bigNumberAttack.plus(bigNumberAdjAttack);

			//var attackNoSharpness = weapon.attack + (weapon.attack * .25 * (weapon.affinity/100));

			weapon.calcAttack = Calculator.calculateDamage(attackNoSharpness, weapon.sharpness);

			console.log("elementModStorage", elementModStorage);
			//---------CALCULATE ELEMENTAL DAMAGE---------
			_.each(elementModStorage, function(modifier) {

				_.each(weapon.element, function(element) {
					console.log(element.elementID,  modifier.element.elementType)
					if (element.elementID == modifier.element.elementType) {
						if (modifier.element.elementMulti > 0) {
							element.value = element.value * modifier.element.elementMulti;
						
						}
						element.value += modifier.element.elementPlus;
					}
				});
			});

			return weapon;
		});
		console.log("calculate weapon array ", finalWeaponValues);
		return finalWeaponValues;
	},

	calculateDamage: function(rawDamage, sharpnessObject) {
		var sharpnessMultipliers = {
										red: .5,
										orange: .75,
										yellow: 1,
										green: 1.05,
										blue: 1.2,
										white: 1.32};
		var bluntAddtDamage = {
										red: 30,
										orange: 25,
										yellow: 25,
										green: 15,
										blue: 0,
										white: 0};;
		var sharpnessTotal = new BigNumber(0);
		var totalDamage = new BigNumber(0);
		var finalDamageArray = [];
		var maxSharpnessValue = 5;
		var localMinSharpnessValue = Calculator.minSharpnessValue;
		for (var sharpLevel in sharpnessMultipliers) {
			var sharpVal = sharpnessObject[sharpLevel];
			var sharpMulti = sharpnessMultipliers[sharpLevel];
			//var sharpAdjDamage = rawDamage * sharpVal * sharpMulti;
			if (Calculator.blunt) {
				var sharpAdjDamage = rawDamage.plus(bluntAddtDamage[sharpLevel]).times(sharpVal).times(sharpMulti);
			} else {
				var sharpAdjDamage = rawDamage.times(sharpVal).times(sharpMulti);
			}
			if (sharpAdjDamage.equals(0)) {
				maxSharpnessValue--;
			}
			finalDamageArray.push([sharpAdjDamage, sharpVal]);
		}

		if (maxSharpnessValue < localMinSharpnessValue) {
			localMinSharpnessValue = maxSharpnessValue;
		}

		for (var sharpLevel = localMinSharpnessValue; sharpLevel <= maxSharpnessValue; sharpLevel++) {
			totalDamage = totalDamage.plus(finalDamageArray[sharpLevel][0]);
			sharpnessTotal = sharpnessTotal.plus(finalDamageArray[sharpLevel][1]);
		}
		var finalDamage = totalDamage.div(sharpnessTotal);
		return finalDamage;
	},

	//Map an array of kiranico weapon objects into an array of calculator weapon objects
	mapWeapons: function(weaponArray) {
		var returnArray = [];
		var maxLevel = 0;
		_.each(weaponArray, function(weapon) {
			var weaponName = weapon.name;
			maxLevel = weapon.levels.length;
			_.each(weapon.levels, function(level) {
				if (((Calculator.maxLevelOnly && (level.level == maxLevel)) || !Calculator.maxLevelOnly)
					&& ((Calculator.specificLevelID > 0 && Calculator.specificLevelID == level.id) || Calculator.specificLevelID == 0)) {
					var returnObject = {};
					returnObject.weaponName = weaponName + " - level " + level.level;
					returnObject.attack = level.attack;
					returnObject.affinity = level.affinity;
					returnObject.element = Calculator.getElementData(level.elements);
					returnObject.sharpness = Calculator.getSharpnessData(level.sharpness, Calculator.sharpnessValue);
					returnObject.weaponID = level.id;

					//SwitchAxe phial stuff
					if (level.phials.length > 0) {
						var phialObject = level.phials[0]; //Nothing has 2 phials afaik
						returnObject.phial = Calculator.getPhialData(phialObject);
					}
					returnArray.push(returnObject);
				}
			});
		});
		return returnArray;
	},

	createModArray: function(modifiersObject) {
		var modifiersArray = [];

		console.log(modifiersObject);

		_.mapObject(modifiersObject, function(val, key) {
			//Group 'G' are all multipliers, and as such must be done at the end of calculations.
			if (key != "G") {
				modifiersArray.push(val);
			}
		});

		modifiersArray.push(modifiersObject["G"])

		console.log("Created modifier array \n", modifiersArray);
		return modifiersArray;
	},

	getElementData: function(elements) {
		var elementData = [];

		_.each(elements, function(element) {
			var singleElement = {};
			singleElement.elementID = element.pivot.element_id;
			singleElement.elementName = Calculator.getElementName(element.pivot.element_id);
			singleElement.value = element.pivot.value;
			elementData.push(singleElement);
		});

		return elementData;
	},

	getElementName: function(elementID) {
		var elements = ["Fire", "Water", "Thunder", "Dragon", "Ice", "Poison", "Para", "Sleep", "Blast"];
		var elementName = elements[elementID-1];
		return elementName
	},

	getSharpnessData: function(sharpnessArray, sharpnessLevel) {
		var sharpnessData = sharpnessArray[sharpnessLevel];
		delete sharpnessData.pivot;
		delete sharpnessData.id;
		console.log(sharpnessData);
		return sharpnessData;
	},

	getPhialData: function(phialObject) {
		var phialData = {};
		var phials = ["Power", "Element", "Para", "Dragon", "Exhaust", "Poison", "Impact"]
		var phialType = phials[phialObject.id-1];
		var phialValue = phialObject.pivot.value;
		phialData.type = phialType;
		phialData.value = phialValue;
		return phialData;
	}
};

Calculator.init();


function startCalculator() {
	console.log("in startCalculator");
	var weaponTypeCollection = new Calculator.Collections.WeaponTypeCollection();

	var view = new Calculator.Views.WeaponTypeView({ collection: weaponTypeCollection});

	var modifierGroupCollection = new Calculator.Collections.ModifierGroupCollection();
	modifierGroupCollection.fetch({
		success: function() {
			_.each(modifierGroupCollection.toJSON(), function(modGroup) {
				var modifierGroup = new Calculator.Models.ModifierGroup(modGroup);
				$('[data-toggle="tooltip"]').tooltip({
					trigger: 'hover'
				});
			});

		}
	})

	var buttonView = new Calculator.Views.ButtonView();

	var sharpnessView = new Calculator.Views.SharpnessView();

	var minSharpnessView = new Calculator.Views.MinSharpnessView();

	var critBoostView = new Calculator.Views.CritBoostView();

	var bluntView = new Calculator.Views.BluntView();

	Calculator.savedWeapons = new Calculator.Collections.CalculatedWeaponCollection();

	var savedWeaponView = new Calculator.Views.CalculatedWeaponCollectionView({ collection: Calculator.savedWeapons, el: "#savedTableDiv"});

}

function initModels() {
	Calculator.Models.WeaponType = Backbone.Model.extend();
	Calculator.Models.Weapon = Backbone.Model.extend();
	Calculator.Models.Level = Backbone.Model.extend();
	Calculator.Models.ModifierGroup = Backbone.Model.extend({
		parse: function(group) {
			group.modifiers = new Calculator.Collections.Modifiers(group.modifiers);
			group.modifiers.addGroup(group.group);
			var modifiersView = new Calculator.Views.ModifiersView({ collection: group.modifiers });
			modifiersView.render();
			$("#modifiers").append(modifiersView.el);
			return group;
		}
	});
	Calculator.Models.Modifier = Backbone.Model.extend();
	Calculator.Models.WeaponInfo = Backbone.Model.extend();
	Calculator.Models.CalculatedWeapon = Backbone.Model.extend({
		initialize: function() {
			this.convertSharpness()
		},

		convertSharpness: function() {
			var $returnDiv = $("<div>", {class: "sharpness-bar", style: "height: 10px"});

			_.mapObject(this.get("sharpness"), function(val, key) {
				$returnDiv.append($("<span>", {class: key, style: "width: " + val/5 + "px"}));
			});
			this.set("sharpnessBar", $returnDiv.prop("outerHTML"));
			return $returnDiv;
		}
	});
}

function initCollections() {
	Calculator.Collections.WeaponTypeCollection = Backbone.Collection.extend({
		url: "data/weaponType.json",
		model: Calculator.Models.WeaponType
	});

	Calculator.Collections.WeaponCollection = Backbone.Collection.extend({
		model: Calculator.Models.Weapon
	});

	Calculator.Collections.WeaponLevelCollection = Backbone.Collection.extend({
		model: Calculator.Models.Level
	});

	Calculator.Collections.ModifierGroupCollection = Backbone.Collection.extend({
		url: "data/modifierData.json",
		model: Calculator.Models.ModifierGroup
	});

	Calculator.Collections.Modifiers = Backbone.Collection.extend({
		model: Calculator.Models.Modifier,

		addGroup: function(groupID) {
			this.group = groupID;
		},

		getGroup: function() {
			return this.group;
		}
	});

	Calculator.Collections.CalculatedWeaponCollection = Backbone.Collection.extend({
		model: Calculator.Models.CalculatedWeapon,

		comparator: function(calcWeapon) {
			return -calcWeapon.get("calcAttack");
		},

		filterByName: function(name) {
			name = name.toLowerCase();
			var filtered = this.filter(function (weapon) {
				return weapon.get("weaponName").toLowerCase().indexOf(name) != -1;
			});
			return new Calculator.Collections.CalculatedWeaponCollection(filtered);
		}
	})
}

function initViews() {
	Calculator.Views.WeaponTypeView = Backbone.View.extend({
		el: "#type-dd",
		template: _.template($("#weapon-type-template").html()),

		events: {
			"change #weapon-type-select": "selectWeaponType"
		},

		selectWeaponType: function(event) {
			var weaponTypeID = event.target.value;
			var weaponName = "";
			switch(weaponTypeID) {
				case "1":
					weaponName = "Greatswords";
					break;
				case "2":
					weaponName = "Longswords";
					break;
				case "3":
					weaponName = "SwordAndShields";
					break;
				case "4":
					weaponName = "DualBlades";
					break;
				case "5":
					weaponName = "Hammers";
					break;
				case "6":
					weaponName = "HuntingHorns";
					break;
				case "7":
					weaponName = "Lances";
					break;
				case "8":
					weaponName = "Gunlances";
					break;
				case "9":
					weaponName = "SwitchAxes";
					break;
				case "10":
					weaponName = "ChargeBlades";
					break;
				case "11":
					weaponName = "InsectGlaives";
					break;
			}
			Calculator.weaponClass = weaponName;
			var weaponCollection = new Calculator.Collections.WeaponCollection();
			weaponCollection.url = "data/weapons/"+weaponName+".json";
			console.log(typeof weaponView);
			if (typeof weaponView != "undefined") {
				weaponView.remove();
			}
			weaponView = new Calculator.Views.WeaponView({ collection: weaponCollection});
			$('[data-toggle="tooltip"]').tooltip({
				trigger: 'hover'
			});
		},

		initialize: function() {
			var that = this;
			this.collection.fetch({
				success: function() {
					that.render();
				}
			});
			
		},

		render: function() {
			this.$el.html(this.template({ weaponTypes: this.collection.toJSON()}));
		}
	});

	Calculator.Views.WeaponView = Backbone.View.extend({
		el: "#weapon-dd",
		template: _.template($("#weapon-template").html()),

		events: {
			"change #weapon-select": "selectWeapon"
		},

		selectWeapon: function(event) {
			console.log(this.collection.toJSON());
			var weaponID = event.target.value;
			var weapon = _.find(this.collection.toJSON(), function(weapon) {
				return weapon.id == weaponID;
			});
			console.log(weapon);
			if (weaponID > 0) {
				Calculator.selectedWeapons = [];
				Calculator.selectedWeapons.push(weapon);
				var levelCollection = new Calculator.Collections.WeaponLevelCollection(weapon.levels);
				var levelView = new Calculator.Views.LevelView({ collection: levelCollection});
			} else {
				Calculator.selectedWeapons = this.collection.toJSON();
				Calculator.specificLevelID = 0;
				$("#level-dd").empty();
			}
			
		},

		initialize: function() {
			$("#loadingText").append("Loading Weapons...")
			var that = this;
			this.collection.fetch({
				success: function() {
					Calculator.selectedWeapons = that.collection.toJSON();
					that.render();
					$("#loadingText").empty();
				}
			});
		},

		render: function() {
			this.$el.html(this.template({ weapons: this.collection.toJSON()}));
			this.$('[data-toggle="tooltip"]').tooltip({
				trigger: 'hover'
			});
			this.delegateEvents();
		},

		remove: function() {
			this.$el.empty().off(); /* off to unbind the events */
	      	this.stopListening();
	      	return this;
		}
	});

	Calculator.Views.LevelView = Backbone.View.extend({
		el: "#level-dd",
		template: _.template($("#weapon-level-template").html()),

		events: {
			"change #weapon-level-select": "selectLevel"
		},

		selectLevel: function(event) {
			var weaponLevelID = event.target.value;
			var weaponInfo = _.find(this.collection.toJSON(), function(weaponLevel) {
				return weaponLevel.id == weaponLevelID;
			});
			if (weaponLevelID > 0) {
				Calculator.specificLevelID = weaponLevelID;
			} else {
				Calculator.specificLevelID = 0;
			}
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html(this.template({ levels: this.collection.toJSON()}));
		}
	});

	Calculator.Views.ModifiersView = Backbone.View.extend({
		//className: "col-md-3",
		initialize: function() {
			_.bindAll(this, "renderItem");
		},

		renderItem: function(modifier) {
			modifier.set("groupName", this.collection.getGroup());
			var modifierView = new Calculator.Views.ModifierView({ model: modifier });
			modifierView.render();
			this.$el.append(modifierView.el);
		},

		render: function() {
			this.$el.append("<h3>"+this.collection.getGroup()+"</h3>");
			this.collection.each(this.renderItem);
		}
	});

	Calculator.Views.ModifierView = Backbone.View.extend({
		template: _.template($("#modifier-template").html()),

		events: {
			"click input[type=checkbox]":"setChecked"
		},

		setChecked: function(event) {
			
			var selected = $(event.target).is(":checked");
			$(".group"+this.model.get("groupName")+"CB").prop('checked',false);
			if (selected) {
				console.log("setting", this.model.get("groupName"), "to", this.model.get("modifier"));
				Calculator.modifierNameList[this.model.get("id")] = this.model.get("name");
				$(event.target).prop('checked',true);
				Calculator.modifierValues[this.model.get("groupName")] = this.model.get("modifier");
			} else {
				console.log("removing", this.model.get("groupName"));
				Calculator.modifierValues[this.model.get("groupName")] = null;
				Calculator.modifierNameList[this.model.get("id")] = null;
			}

		},

		render: function() {
			this.$el.append(this.template(this.model.toJSON()));
		}
	});

	Calculator.Views.SharpnessView = Backbone.View.extend({
		el: "#sharpness-picker",

		events: {
			"change input[type=radio]": "setSharpness"
		},

		setSharpness: function(event) {
			Calculator.sharpnessValue = event.target.value;
			Calculator.modifierNameList[52] = "Sharpness +" + Calculator.sharpnessValue;
		}
	});

	Calculator.Views.MinSharpnessView = Backbone.View.extend({
		el: "#minimum-sharpness",

		events: {
			"change input[type=radio]": "setMinSharpness"
		},

		setMinSharpness: function(event) {
			console.log("setting min sharpness to ", event.target.value);
			Calculator.minSharpnessValue = event.target.value;
			var sharpnessArray = ["Red","Orange","Yellow","Green","Blue","White"];
			Calculator.modifierNameList[51] = "Minimum " + sharpnessArray[Calculator.minSharpnessValue] + " Sharpness";
			if (event.target.value == "2" || event.target.value == "1" || event.target.value == "0") {
				$("#sharpness-warning").empty();
				$("#sharpness-warning").append("<h4 style='color: red'>There's a penalty for hitting too early/too late when in yellow or lower sharpness. Thus, using sharpness this low is not recommended. Configurations with bludgeoner will be artificially inflated.</h4>");
			} else {
				$("#sharpness-warning").empty();
			}
		}
	});

	Calculator.Views.CritBoostView = Backbone.View.extend({
		el: "#crit-boost",

		events: {
			"change input[type=radio]": "setCritBoost"
		},

		setCritBoost: function(event) {
			var critBoostActive = event.target.value == "true" ? true : false;
			console.log("critBoost:", critBoostActive);
			Calculator.critBoost = critBoostActive;
			Calculator.modifierNameList[50] = critBoostActive ? "Crit Boost" : null;
		}
	});

	Calculator.Views.BluntView = Backbone.View.extend({
		el: "#blunt",

		events: {
			"change input[type=radio]": "setBlunt"
		},

		setBlunt: function(event) {
			var bluntActive = event.target.value == "true" ? true : false;
			console.log("blunt:", bluntActive);
			Calculator.blunt = bluntActive;
			Calculator.modifierNameList[53] = bluntActive ? "Bludgeoner" : null;
		}
	});

	Calculator.Views.ButtonView = Backbone.View.extend({
		el: "#buttons",

		events: {
			"click #compareClass": "compareWeapons",
			"click input[type=checkbox]": "setMaxLevelOnly"
		},

		compareWeapons: function() {
			$("#calc-weapon-table").empty();
			var calculatedWeaponArray = Calculator.calculate(Calculator.selectedWeapons, Calculator.modifierValues);
			var calcedWeaponCollection = new Calculator.Collections.CalculatedWeaponCollection();
			_.each(calculatedWeaponArray, function(calcedWeapon) {
				var calcedWeaponModel = new Calculator.Models.CalculatedWeapon(calcedWeapon);
				calcedWeaponCollection.add(calcedWeaponModel);
			});
			var calcWeaponCollView = new Calculator.Views.CalculatedWeaponCollectionView({ collection: calcedWeaponCollection, el: "#displayTable"});
			calcWeaponCollView.render();
			Calculator.calcWeaponsMods = Calculator.modifierNameList.slice();
		},

		setMaxLevelOnly: function(event) {
			Calculator.maxLevelOnly = event.target.checked;
		},

	});

	Calculator.Views.CalculatedWeaponView = Backbone.View.extend({
		tagName : 'tr',
		template: _.template($("#calc-weapon-row-template").html()),
		attributes: function() {
			return {
				"data-toggle": "tooltip",
				title: _.map(_.compact(Calculator.calcWeaponsMods), function(mod) {return mod = " " + mod}),
				"data-placement": "left"
			}
		},

		events: {
			"click" : "saveWeapon"
		},

		saveWeapon: function(event) {

			if(this.model.get("saved")) {
				Calculator.savedWeapons.remove(this.model);
				$('.tooltip').remove();
				this.remove();
			} else {
				var savedCopy = new Calculator.Models.CalculatedWeapon(this.model.toJSON());
				savedCopy.set("saved", true);
				Calculator.savedWeapons.add(savedCopy);
				console.log("saved ", savedCopy);
				$('[data-toggle="tooltip"]').tooltip({
				trigger: 'hover'
			});
			}
		},

		initialize: function() {
		
		},

		render: function() {
			this.$el.html(this.template({ weapon: this.model.toJSON(), weaponClass: Calculator.weaponClass }));
		}
	});

	Calculator.Views.CalculatedWeaponCollectionView = Backbone.View.extend({

		events: {
			"keyup .searchBox": "filterResults"
		},

		initialize: function() {
			_.bindAll(this, "renderItem");
			this.collection.on("add", this.renderItem, this);
		},

		renderItem: function(calcWeapon) {
			var calculatedWeaponView = new Calculator.Views.CalculatedWeaponView({ model: calcWeapon });
			calculatedWeaponView.render();
			this.$(".weapon-table").append(calculatedWeaponView.el);
		},

		filterResults: function(event) {
			var filterText = event.target.value;
			var filteredCollection = this.collection.filterByName(filterText);
			this.$(".weapon-table").empty();
			filteredCollection.each(this.renderItem);
		},

		render: function() {
			this.collection.each(this.renderItem);
		}
	});



	//depreciated, now all weapon rows are an individual view to keep better track of them
	/*
	Calculator.Views.WeaponTableView = Backbone.View.extend({
		el: "#calc-weapon-table",
		template: _.template($("#table-template").html()),
		sharpnessDiv: "",

		initialize: function() {
			_.each(this.collection, this.convertSharpness);
			console.log(this.collection);
			this.render();
		},

		render: function() {
			this.$el.html(this.template({ weaponInfo: this.collection, weaponClass: Calculator.weaponClass }));
			var options = {
				valueNames: [ "name", "attack", "affinity", "calcAttack"]
			};
			var weaponList = new List("displayTable", options);
		},

		convertSharpness: function(weapon) {
			var $returnDiv = $("<div>", {class: "sharpness-bar", style: "height: 10px"});

			_.mapObject(weapon.sharpness, function(val, key) {
				$returnDiv.append($("<span>", {class: key, style: "width: " + val/5 + "px"}));
			});
			weapon.sharpnessBar = $returnDiv.prop("outerHTML");
			return $returnDiv;
		}
	});
	*/
}
