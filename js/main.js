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

function initModels() {
	Calculator.Models.WeaponType = Backbone.Model.extend();
	Calculator.Models.Weapon = Backbone.Model.extend();
	Calculator.Models.Level = Backbone.Model.extend();
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
		initialize: function() {
			this.render();
		},

		render: function() {
			console.log(this.collection.toJSON());
			this.$el.html(this.template({ levels: this.collection.toJSON()}));
		}
	});
}