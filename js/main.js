var AppView = Backbone.View.extend({
	el: '#container',

	template:_.template("<h3>Hello <%= who %></h3>"),

	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html(this.template({who: 'world!'}));
	}
});

var appView = new AppView();