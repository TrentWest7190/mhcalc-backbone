# Monster Hunter Generations Calculator

Monster Hunter Generations weapon damage calculator in the backbone framework.

# How To Use

Select a weapon class, select modifiers, and hit calculate!

## Minimum Sharpness

*   This refers to the minimum sharpness that you'll allow a weapon to reach, before sharpening
*   For instance, if set to "Green", the calculation will expect you to sharpen when your weapon reaches yellow sharpness
*   If the weapon's maximum sharpness is less than the selected sharpness, the calculator will assume you to sharpen the weapon as soon as it reaches the next lowest sharpness. I.E, If "Blue" is selected, but the maximum sharpness only goes up to green, it will expect you to sharpen at yellow
*   If nothing is selected, it defaults to "White"

# What's new?

## V 2.01

*   Added this about panel
*   Added a search bar to each table
*   Made the individual weapon and level dropdowns actually work

## V 2.0

*   There's now a second table where you can save weapons/armor setups

*   Just click on a configuration to save it to the second table
*   Mousing over a saved configuration will display the modifiers active when it was added to the table

*   More CSS changes. Site is now /less/ better looking on mobile. (Sorry)

## V 1.01

*   Switch Axes now take power phial into account. (Because why would you use any other phial type)
*   Couple of CSS changes. Site should be very very slightly better looking on mobile.

# To-do

*   Add the ability to save weapon tables locally
*   Make the table update automatically when you change modifiers
*   Finish up missing modifiers (Razor sharp, polar hunter, tropic hunter, others)
*   Compare weapons against a specific monster
*   Take Hunter Arts into account
*   Create the ability to export armor configurations to Athena's Armor Search
*   Take motion values into account
*   Gunner stuff maybe?

## Credits

All weapon data is pulled straight from [kiranico.](http://mhgen.kiranico.com/)
