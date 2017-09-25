# Asteroids
An clone of the arcade classic [Asteroids](https://en.wikipedia.org/wiki/Asteroids_(video_game)) in HTML5,
created for the Fall 2016 class of CIS 580 at Kansas State University.

## Bundling
The source code in the src directory is bundled into a single file using **Browserify**.  The Browserify tools must first be installed on your system:

```$ npm install -g browserify``` (for OSX and linus users, you may need to preface this command with ```sudo```)

Once installed, you can bundle the current source with the command:

```$ browserify src/app.js -o bundle.js```

Remember, the browser must be refreshed to receive the changed javascript file.

## Watching

You may prefer to instead _watch_ the files for changes using **Watchify**.  This works very similarily to Browserify.  It first must be installed:

```$ npm install -g watchify``` (again, ```sudo``` may need to be used on linux and OSX platforms)

Then run the command:

```watchify src/app.js -o bundle.js```

The bundle will automatically be re-created every time you change a source file.  However, you still need to refresh your browser for the changed bundle to take effect.

## Credits
Asteroids provided by phaelax under CC license http://opengameart.org/content/asteroids
Explosions provided by Cuzco under public domain license http://opengameart.org/content/explosion
Explosion sound provided by ljudman from http://soundbible.com/1367-Grenade.html
background from https://pixabay.com/en/nightsky-astronomy-stars-background-16967/

Background music courtesy of Music from Jukedeck - create your own at http://jukedeck.com

In game sounds courtesy of bfxr (http://bfxr.net)
