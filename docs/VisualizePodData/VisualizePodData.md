# Visualizing Pod data

These simple instructions walk you through the 10-minute process of registering
for the Free edition of the commercial triplestore from Ontotext (named
_GraphDB_), installing that triplestore, creating a new repository, loading some
dummy Pod data into that repository, and finally visualizing that Pod data
yourself.

## Install Free triplestore on your own machine:

- Go to `https://www.ontotext.com/products/graphdb/graphdb-free/` and register
  (there’s no longer any need to use a real email address - see the next step!).

- You can wait for the confirmation email and follow the instructions to
  ”_Run GraphDB as a desktop installation_", or just register using any email
  address and then simply click on the relevant operating system under the
  “_GraphDB Download Links_“ section to install GraphDB immediately!.

## Run GraphDB

- Execute GraphDB.

## Create a new repository

We'll now simply follow the introductory "_Welcome to GraphDB_" steps, which
we'll also walk through below:

To create a new empty repository:

- From the main menu (on the left-hand-side), select "Setup | Repositories".
- Click the "_Create new repository_" button.
- Select the first "_GraphDB Repository_" option.
- Provide any name (without spaces!) for the "_Repository ID_" field, e.g.,
  "Inrupt-SamplePod".
- Click the "_Create_" button at the bottom of the page.

## Load example Pod data:

- From the main menu (on the left-hand-side), select "_Import_".
- Connect to the repository you’ve just created.
- Select the middle option, "_Get RDF data from a URL_".
- Enter the URL of our example Pod data file: 
  `https://storage.inrupt.com/6441a53f-01c5-478b-b701-52a8797ba988/public/PodPat.trig`
  (or import the local file: [../../resources/test/PodPat.trig](../../resources/test/PodPat.trig))
- Click on the "_Import_".

## Visualize and interact with the Pod data yourself!

- From the main menu (on the left-hand-side), select "_Explore | Visual graph_".
- In the top "_Easy graph_" section, simply copy-and-paste this URL:
  `https://pat.best-pod-provider.com/profile/card#me`
- ...and click the "_Show_" button
- **_Now try double-clicking on the nodes to expand them and explore (see a sample
  expanded view [here](./VisualizeExamplePodData.png))._**

# UI Navigation Tips

- Dragging-and-dropping any node ‘pins’ it to its dropped position.
- Single click on any node to see its ‘Properties’ in the right-hand sidebar.
  Single clicking that node again will dismiss the sidebar.
- Hovering over a node pops up a nice icon menu (from which you can remove the
  node (just from the visualization, not the database!), etc.), but these icons
  only appear if the sidebar is dismissed (so single click the node to dismiss
  the sidebar first, if needed).
- To ‘restart’ the visualization (e.g., if things get cluttered or confusing),
  simply use <Ctrl>-R to refresh and start navigating again.
- Note that the sidebar only displays properties whose values are literals, not
  links (IRIs).
