var WeaponTypeCollection = Backbone.Collection.extend({
	url: "/data/weaponType.json",
	model: WeaponType,
});