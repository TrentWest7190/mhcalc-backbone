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
}

function initCollections() {
	Calculator.Collections.WeaponTypeCollection = Backbone.Collection.extend({
		url: "/data/weaponType.json",
		model: Calculator.Models.WeaponType
	});

	Calculator.Collections.WeaponCollection = Backbone.Collection.extend({
		url: "/data/weaponData.json",
		model: Calculator.Models.Weapon
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
			var weaponCollection = new Calculator.Collections.WeaponCollection();
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
		},
	});
}