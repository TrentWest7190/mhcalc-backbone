var Calculator = {
	Models : {},
	Collections : {},
	Views : {},

	init : function() {
		initModels();
		initCollections();
		initViews();
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

		});

	}
})



function initModels() {
	Calculator.Models.WeaponType = Backbone.Model.extend();
	Calculator.Models.Weapon = Backbone.Model.extend();
	Calculator.Models.Level = Backbone.Model.extend();
	Calculator.Models.ModifierGroup = Backbone.Model.extend({
		parse: function(group) {
			group.modifiers = new Calculator.Collections.Modifiers(group.modifiers);
			return group;
		}
	});
	Calculator.Models.Modifier = Backbone.Model.extend();
	Calculator.Models.WeaponInfo = Backbone.Model.extend();
}

function initCollections() {
	Calculator.Collections.WeaponTypeCollection = Backbone.Collection.extend({
		url: "/data/weaponType.json",
		model: Calculator.Models.WeaponType
	});

	Calculator.Collections.WeaponCollection = Backbone.Collection.extend({
		model: Calculator.Models.Weapon
	});

	Calculator.Collections.WeaponLevelCollection = Backbone.Collection.extend({
		model: Calculator.Models.Level
	});

	Calculator.Collections.ModifierGroupCollection = Backbone.Collection.extend({
		url: "/data/modifierData.json",
		model: Calculator.Models.ModifierGroup
	});

	Calculator.Collections.Modifiers = Backbone.Collection.extend({
		model: Calculator.Models.Modifier,

		initialize: function(modifiers) {
			console.log(modifiers);
			var modifiersView = new Calculator.Views.ModifiersView({ collection: modifiers });
			modifiersView.render();
			$("#testtest").append(modifiersView.el);
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
			weaponTypeID = "1";
			var weaponName = "";
			switch(weaponTypeID) {
				case "1":
					weaponName = "Greatswords";
					break;
			}
			var weaponCollection = new Calculator.Collections.WeaponCollection();
			weaponCollection.url = "/data/weapons/"+weaponName+".json";
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
			console.log(this.collection.toJSON());
			this.$el.html(this.template({ levels: this.collection.toJSON()}));
		}
	});

	Calculator.Views.WeaponInfoView = Backbone.View.extend({
		el: "#weapon-info",
		template: _.template($("#weapon-info-template").html()),

		render: function() {
			console.log(this.model.toJSON());
			this.$el.html(this.template(this.model.toJSON()));
		}
	});

	Calculator.Views.ModifiersView = Backbone.View.extend({
		initialize: function() {
			console.log(this.collection);
			_.bindAll(this, "renderItem");
		},

		renderItem: function(modifier) {
			console.log("rendering modifier", modifier);
			var modifierView = new Calculator.Views.ModifierView({ model: modifier });
			modifierView.render();
			this.$el.append(modifierView.el);
		},

		render: function() {
			console.log("render ModifiersView");
			if (this.collection.length > 1)
				this.collection.each(this.renderItem);
			else
				this.renderItem(this.collection);
		}
	});

	Calculator.Views.ModifierView = Backbone.View.extend({

		events: {
			"click":"displayModInfo"
		},

		displayModInfo: function() {
			console.log("clicked " + this.model.name + "\n");
		},

		render: function() {
			this.$el.append(this.model.name+"<br>");
		}
	});
}