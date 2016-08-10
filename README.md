# mhcalc-backbone

Monster Hunter Generations weapon damage calculator in backbone framework

[Use it here](http://trogg.net/MHCalc/)

# How To Use

Select a weapon class, select modifiers, and hit calculate!

## Minimum Sharpness

- This refers to the minimum sharpness that you'll allow a weapon to reach, before sharpening
- For instance, if set to "Green", the calculation will expect you to sharpen when your weapon reaches yellow sharpness
- If the weapon's maximum sharpness is less than the selected sharpness, the calculator will assume you to sharpen the weapon as soon as it reaches the next lowest sharpness. I.E, If "Blue" is selected, but the maximum sharpness only goes up to green, it will expect you to sharpen at yellow
- If nothing is selected, it defaults to "White"

## What's new?
### V 2.0

- There's now a second table where you can save weapons/armor setups
-- Just click on a configuration to save it to the second table
-- Mousing over a saved configuration will display the modifiers active when it was added to the table
- More CSS changes. Site is now /less/ better looking on mobile. (Sorry)

### V 1.01

- Switch Axes now take power phial into account. (Because why would you use any other phial type)
- Couple of CSS changes. Site should be very very slightly better looking on mobile.

## To-do
- Make the table update automatically when you change modifiers
- Compare weapons against a specific monster
- Finish up missing modifiers (Blunt edge, Razor sharp, others)
- Gunner stuff maybe?
- Add an about modal

## Credits

All weapon data is pulled straight from [kiranico.](http://mhgen.kiranico.com/)
