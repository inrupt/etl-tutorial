# Advanced vocabulary management

Sometimes as developers we need to work extensively with already published
vocabularies. For example, cherry-picking just a select few terms from extensive
vocabularies like Schema.org, or regularly adding new terms to existing shared
vocabularies (such as a company-wide 'Common Terms' vocabulary, or company
glossary or acronym vocabularies).

In these scenarios, it would be very tedious and time-consuming if we had to
make PRs to the remotely managed vocabularies every time we wanted a change, as
we'd have to wait for our PRs to be reviewed, merging, and then new generated
artifacts re-published containing the updates we require.

## The Inrupt vocab scripts

To greatly ease this process for developers, Inrupt provides a set of
sophisticated bash scripts. One of these scripts automatically allows to us
clone any remote vocabulary repository and then executes Inrupt's Artifact
Generator (AG) (that the script also clones down if necessary), and run that
generator locally on that locally cloned vocabulary repository to generate local
artifacts for the developer.

This script also automatically updates the local `package.json` to depend on the
local artifact instead of the remotely published version. The script can also
use the AG's ability to run file watchers that detect edits to any local copies
of the individual vocabulary files, and that then automatically kicks off
re-generation of the corresponding artifacts.

This means developers can now make as many local edits as they like to these
vocabularies, and see the effects immediately in their IDE's and code, thereby
massively improving the experience of working with shared remote vocabularies.

These bash scripts are fully open-source, and available here:
[@inrupt/solid-common-vocab-script](https://github.com/inrupt/solid-common-vocab-script),
and can simply be cloned and run.

### Push changes upstream

Of course, developers need to make sure that they occasionally create PRs back
to the upstream vocabulary repositories if they want their local changes to be
reflecting in that shared repository, and thereby reusable by all other users of
those vocabularies.

### Sharing local updates within a development team

It's good to remember that the AG is capable of publishing to many different
repositories, and so if a team of developers wish to collaborate on team-only
changes to remote vocabularies (but without yet sharing their changes more
broadly by pushing those changes back up to the upstream), they can easily share
their changes just within that team by only publishing to an internal,
team-access-only repository, such as a team Verdaccio server, or a team Maven
repository.

### Using the `installVocab.sh` script

The most powerful of the vocabulary management scripts is `installVocab.sh`,
which carries out all the actions described above, specifically:

- Cloning locally a remote vocabulary repository.
- Cloning and installing the Artifact Generator (AG).
- Selecting a specific vocabulary bundle (from GitHub repositories that provide
  multiple bundles of vocabularies (e.g., Inrupt's
  [@inrupt/solid-common-vocab-rdf](https://github.com/inrupt/solid-common-vocab-rdf)
  repository provides 3 separate bundles (one for over 40 common RDF
  vocabularies, one for all the Solid-specific vocabularies, and one for all the
  Inrupt-specific vocabularies).
- Running the AG on an individual vocabulary bundle to generate artifacts
  locally.
- Updating the local `package.json` to depend on a specific local artifact.
- (Optionally) running the AG in watcher mode to automatically re-generate those
  local artifacts on every edit to any of the individual RDF vocabulary files
  that make up that bundle.
- Finally, if run in watcher mode, the script will also generate a local bash
  script that allows re-running just the watcher component (convenient when you
  re-boot your machine and simply want to continue watching the local RDF
  vocabularies for changes). This script will be named:
  - `./watch-<CLONED-VOCABULARY-REPOSITORY-NAME>.sh`

For example, to do all this for Inrupt's bundle of common RDF vocabularies (say
we wish to cherry-pick multiple new terms from Schema.org), simply run this
command (assuming you cloned the script repository into a sibling directory of
the current directory):

```script
../solid-common-vocab-script/installVocab.sh -r git@github.com:inrupt/solid-common-vocab-rdf.git -m @inrupt/vocab-common-rdf -i common-rdf -l -w
```

You can repeat running this script for any additional vocabulary bundles you
wish to work with locally. **_Note_**: if running multiple times, you can add
the `-x` switch to prevent attempting to clone or update the AG each time (as it
only needs to be cloned and installed once).

Also, if you **_don't_** want the AG to run in watcher mode (but to only run
once to generate, or re-generate, the local artifact), simply remove the `-w`
switch.
