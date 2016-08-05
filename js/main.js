var Calculator = {
	Models : {},
	Collections : {},
	Views : {},
	modifierValues: {}, //a very, very simple implemenation of a hashmap to hold modifier values
	selectedWeapons: {},
	sharpnessValue: 0,
	minSharpnessValue: 5,
	maxLevelOnly: false,

	init : function() {
		initModels();
		initCollections();
		initViews();
	},

	//calculates the end attack and affinity values of an array of kiranico weapon objects using the modifier object passed in
	calculate: function(kiranicoWeaponArray, modifiersObject) {
		var mappedWeapons = this.mapWeapons(kiranicoWeaponArray);
		var modifierArray = this.createModArray(modifiersObject);

		//for each weapon in the weapon array
		var finalWeaponValues = _.map(mappedWeapons, function(weapon) {
			//for each modifier in the modifier array
			_.each(modifierArray, function(modifier) {
				if (modifier != null) {
					weapon.attack += modifier[0];
					weapon.affinity += modifier[1];
					if (modifier[2]) weapon.attack = weapon.attack * modifier[2];
				}
			});

			var bigNumberAttack = new BigNumber(weapon.attack);
			var bigNumberAffinity = new BigNumber(weapon.affinity);
			var bigNumberAdjAttack = bigNumberAttack.times(.25).times(bigNumberAffinity).div(100);

			var attackNoSharpness = bigNumberAttack.plus(bigNumberAdjAttack);

			//var attackNoSharpness = weapon.attack + (weapon.attack * .25 * (weapon.affinity/100));

			weapon.calcAttack = Calculator.calculateDamage(attackNoSharpness, weapon.sharpness)

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
		var sharpnessTotal = new BigNumber(0);
		var totalDamage = new BigNumber(0);
		var finalDamageArray = [];
		var maxSharpnessValue = 5;
		var localMinSharpnessValue = Calculator.minSharpnessValue;
		for (var sharpLevel in sharpnessMultipliers) {
			var sharpVal = sharpnessObject[sharpLevel];
			var sharpMulti = sharpnessMultipliers[sharpLevel];
			//var sharpAdjDamage = rawDamage * sharpVal * sharpMulti;
			var sharpAdjDamage = rawDamage.times(sharpVal).times(sharpMulti);
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
				if ((Calculator.maxLevelOnly && (level.level == maxLevel)) || !Calculator.maxLevelOnly) {
					var returnObject = {};
					returnObject.weaponName = weaponName + " - level " + level.level;
					returnObject.attack = level.attack;
					returnObject.affinity = level.affinity;
					returnObject.element = Calculator.getElementData(level.elements);
					returnObject.sharpness = Calculator.getSharpnessData(level.sharpness, Calculator.sharpnessValue);
					returnArray.push(returnObject);
				}
			});
		});
		return returnArray;
	},

	createModArray: function(modifiersObject) {
		var modifiersArray = [];

		_.mapObject(modifiersObject, function(val, key) {
			modifiersArray.push(val);
		});

		console.log("Created modifier array \n", modifiersArray);
		return modifiersArray;
	},

	getElementData: function(elements) {
		var elementData = [];

		_.each(elements, function(element) {
			var singleElement = {};
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
	}
};

Calculator.init();

var weaponTypeCollection = new Calculator.Collections.WeaponTypeCollection();

var view = new Calculator.Views.WeaponTypeView({ collection: weaponTypeCollection});

var modifierGroupCollection = new Calculator.Collections.ModifierGroupCollection();
modifierGroupCollection.fetch({
	success: function() {
		_.each(modifierGroupCollection.toJSON(), function(modGroup) {
			var modifierGroup = new Calculator.Models.ModifierGroup(modGroup);
			$('[data-toggle="tooltip"]').tooltip();
		});

	}
})

var buttonView = new Calculator.Views.ButtonView();

var sharpnessView = new Calculator.Views.SharpnessView();

var minSharpnessView = new Calculator.Views.MinSharpnessView();



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
			var weaponCollection = new Calculator.Collections.WeaponCollection();
			weaponCollection.url = "data/weapons/"+weaponName+".json";
			weaponView = new Calculator.Views.WeaponView({ collection: weaponCollection});
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
			var weaponID = event.target.value;
			var weapon = _.find(this.collection.toJSON(), function(weapon) {
				return weapon.id == weaponID;
			});
			var levelCollection = new Calculator.Collections.WeaponLevelCollection(weapon.levels);
			var levelView = new Calculator.Views.LevelView({ collection: levelCollection});
		},

		initialize: function() {
			var that = this;
			this.collection.fetch({
				success: function() {
					Calculator.selectedWeapons = that.collection.toJSON();
					that.render();
				}
			});
		},

		render: function() {
			this.$el.html(this.template({ weapons: this.collection.toJSON()}));
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
			var weaponInfoModel = new Calculator.Models.WeaponInfo(weaponInfo);
			var weaponInfoView = new Calculator.Views.WeaponInfoView({ model: weaponInfoModel});
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.$el.html(this.template({ levels: this.collection.toJSON()}));
		}
	});

	Calculator.Views.ModifiersView = Backbone.View.extend({
		className: "col-md-3",
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
				$(event.target).prop('checked',true);
				Calculator.modifierValues[this.model.get("groupName")] = this.model.get("modifier");
			} else {
				console.log("removing", this.model.get("groupName"));
				Calculator.modifierValues[this.model.get("groupName")] = null;
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
		}
	});

	Calculator.Views.ButtonView = Backbone.View.extend({
		el: "#buttons",

		events: {
			"click #compareClass": "compareClass",
			"click input[type=checkbox]": "setMaxLevelOnly"
		},

		compareClass: function() {
			var weaponClassValues = Calculator.calculate(Calculator.selectedWeapons, Calculator.modifierValues);
			var weaponClassView = new Calculator.Views.WeaponTableView({ collection: weaponClassValues});
		},

		setMaxLevelOnly: function(event) {
			Calculator.maxLevelOnly = event.target.checked;
		}

	});

	Calculator.Views.WeaponTableView = Backbone.View.extend({
		el: "#displayTable",
		template: _.template($("#table-template").html()),
		sharpnessDiv: "",

		initialize: function() {
			_.each(this.collection, this.convertSharpness);
			this.render();
		},

		render: function() {
			this.$el.html(this.template({ weaponInfo: this.collection }));
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
}
