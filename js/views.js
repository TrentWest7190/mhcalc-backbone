var WeaponTypeView = Backbone.View.extend({
	el: "#test-div",
	template: _.template($("#weapon-type-template").html()),
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