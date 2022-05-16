# How Solid Stores Data

This presentation is about the most fundamental cornerstone of the ENTIRE
Solid proposition - which is, quite simply, how we represent and store data
in Pods.

So Solid actually uses a VERY mature, fully W3C-standardized technology to do
that, called LINKED DATA. And here I'm specifically going to talk about Linked
Data's GENERAL applicability in Enterprises environments.

So, what is "Linked Data"?

## What is Linked Data?

[Slide 2](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide2-TimsTedTalk2009.png)

Well, the term itself was originally coined by Sir Tim Berners-Lee back in 2006,
and awareness was accelerated by this Ted-talk given by Tim in 2009.

Tim begins his talk by explaining how he was driven to invent the World
Wide Web ITSELF by his ongoing frustrations with NON-INTEROPERABLE systems, and
NON-STANDARD data formats, while working at CERN.

In other words, from his having to deal with lots and lots of VERY DIFFERENT
SILOS. And that's something that I hope sounds at least VAGUELY familiar to
everyone here even today, some 33 years later!

In fact, recently ([Feb 2022](https://twitter.com/elonmusk/status/1495901654872383499)),
ELON MUSK posted a tweet complaining about the NIGHTMARE of usernames,
passwords, and 2FA for all the TV streaming services available today.

      <CLICK ON LINK>

But of course, Elon's nightmare is really just down to each of today's streaming
services CONTINUING to be its own silo - basically it's just a reflection of
Tim's same frustrations 33 years ago.

Anyway, in his TED talk, Tim goes on to explain that his original vision
for the Web was ALWAYS to try and address this endless data silo problem.
What he REALLY wanted to do was make INDIVIDUAL PIECES OF DATA interoperable
and shareable over the Internet - and not the more coarse-grained DOCUMENTS,
or WEB PAGES, that have made up the bulk of the Web to-date.

And so, in 2006, Tim coined the phrase "Linked Data" as a way to try and
re-frame his original vision, back to his original INTENT of being able to
share and link together individual PIECES OF DATA.

Tim then continues by describing a set of 5 VERY SIMPLE RULES to allow
exactly that, all the while being based on open, interoperable STANDARDS (which of
course REMAINS one of the fundamental principles that led to the phenomenal
success of the Web in the first place).

And I've included a link here to a nice description of those rules, which have
become known as the "5-stars of Linked Data".

        <CLICK ON LINK>

So in effect, the term "Linked Data" simply refers to ANY data that is
expressed following this simple set of rules - rules that, in effect, define
"Graph data on the Web".

And so that's Linked Data really - it's just "Graph data on the web".

But in general terms, what do we mean by "Graph Data" in the first place?

## What do we mean by Graphs?

[Slide 3](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide3-GraphMotifEverywhere.png)

Well, what I DON'T mean is line graphs, or pie charts, or histograms - not ANY
of those types of graph.

Instead I just mean the EXTREMELY familiar "CIRCLES WITH LINES LINKING THEM
TOGETHER" type of graph - or, in other words, a 'NETWORK', or a 'WEB'!

Now this image, or motif, of "CIRCLES AND LINES LINKING THEM" is becoming more
and more ubiquitous today, as I'd hope you'd all agree - and, I'd argue, for
VERY good reason.

In the bottom right here, we show a simple IMAGE search, JUST for the single
word 'NETWORK', and we see that motif in every image. But the even bigger
image to the left is a search for the single word "TECHNOLOGY", which I think
shows just how ubiquitous this image of "CIRCLES WITH LINES LINKING THEM" has
become in modern life - I mean, it's literally everywhere now, right?

And I believe that the main REASON for this is simply because EVERYONE (and I
mean corporations, governments, and individuals alike) are becoming
INCREASINGLY aware that everything is, and always has been, INHERENTLY
inter-connected and inter-linked.

So, certainly Facebook and LinkedIn have popularized this concept for the
masses (right!?), since we all naturally refer now to our NETWORK of friends,
or our NETWORK of work colleagues, and in a very real sense (and most
certainly in a 'DATA' sense), all of the day-to-day operations of any
enterprise, or even YOUR OWN PERSONAL LIFE as an individual, INHERENTLY FORMS
A GRAPH.

In other words, it's all "CIRCLES WITH LINES LINKING THEM TOGETHER", be it
an Enterprise's supply-chain NETWORK (which is just an inter-connected graph of
suppliers), or that Enterprise's customers recommending their products to their
NETWORK of family and friends, or multiple Government departments providing
services to citizens - basically everything taken together forms a graph of
"CIRLES AND LINES LINKING THEM TOETHER".

And as I say, Enterprises have INCREASINGLY been realising the importance of
this inherent INTER-CONNECTED-NESS, both for their INTERNAL systems, but also
across ALL of their customer relationships too...

## Adoption of Graph Technology

[Slide 4](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide4-RisingGraphTechAdoption.png)

So on this slide I thought I'd try and highlight the rapidly GROWING adoption
of Graph technology GENERALLY, starting on the left here with Graph DATABASE
popularity, over the past 9 or so years. And we can see that GRAPH databases
continue to be BY FAR the most popular category of database.

So graph databases are typically used to drive Knowledge Graphs, or to perform
graph analytics (or both), and on the right-hand side here we show the
household-name Enterprises that have already PUBLICLY announced using Knowledge
Graphs to help drive their businesses - i.e., the likes of Google, Facebook,
the BBC, Walmart, Amazon, The New York Times, etc., etc.

And this rise in Knowledge Graphs generally is, I BELIEVE, due to this
recognition that to understand ANY complex THING (be that an internal
Enterprise system, or a supplier, or any individual customer, or a CITIZEN),
you need to see, connect and thereby understand ALL the interactions that that
THING has across your entire organization (for example, this is now regularly
referred to as having a full 360-degree-view of the customer).

In the bottom right here I've referenced a nice list of the range of
applications that graph databases are ideally suited to address....

        <CLICK ON LINK>
     ...including Fraud detection, network analysis, recommendation engines,
     ...and of course Knowledge Graphs at the end.

And of course we think PERSONAL DATA is just yet another ideal application for
graphs.

Finally, I also dropped in a reference from Gartner, merely to illustrate just
how BROADLY across the entire industry the POTENTIAL for graph technology is
now being recognized.

So, to help illustrate all of this a bit more TANGIBLY, I'd like to quickly
illustrate just THREE real-world examples from my own PERSONAL experience of
using Linked Data in Enterprises...

## Use-case: D&B - Corporate Ownership Structure

[Slide 5](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide5-UseCase-DNB.png)

Firstly I'm showing a screenshot here from Open Corporates, who aim to be "The
largest OPEN database of company information in the world".

Now, I show this as an example of VERY SIMILAR work I did while at Dun &
Bradstreet (D&B) - but since D&B never publicly demonstrated that work,
unfortunately I can't show that actual work itself.

So D&B is one of the oldest American corporations, and it's actually
responsible for issuing the OFFICIAL 9-digit company identifiers for ALL
companies registered in the United States (identifiers known as DUNS numbers).
But D&B make their MONEY from selling reports on companies, detailing things
like a company's creditworthiness, or it's risk of going out-of-business, etc.

Now, I had the honour of being the Technical Architect for D&B's first ever
product in the Corporate Compliance marketplace, and I used that opportunity
to introduce Linked Data to demonstrate just how DRASTICALLY MORE efficient
graphs can represent "Corporate Ownership" information, which is simply what
companies own what companies own what companies, etc. - in other words, all of
a company's subsidiaries, and all of its parents.

And that's what we see visualized here by Open Corporates. This is the
Corporate Ownership structure of JP Morgan from the perspective of a single
subsidiary, in this case a minor subsidiary based in the Cayman Islands.

Now this ownership structure is crucially important for Corporate Compliance,
as, for example, having one of YOUR company directors also be a director of a
supplier (OR of any of that supplier's subsidiaries, OR any of that supplier's
parent companies) can lead to serious conflict-of-interest violations.

Anyway in short, simply switching to a graph database provided an immediate
18-TIMES performance improvement over D&B's existing, EXTREMELY EXPENSIVE,
Oracle databases.

(NOW, JUST QUICKLY FOR THE DEVELOPERS HERE, the reason (which is kinda
self-evident, ONCE YOU'VE DONE IT!) is that performing hundreds, or thousands,
of self-joins on a relational database table is ALWAYS going to be at least AN
ORDER OF MAGNITUDE slower than simply traversing 'hasParent' links in a graph
database, which is all we needed to do here to determine the complete corporate
ownership structure for any company.)

But EVEN MORE CRITICALLY, because this information was now represented as
Graph Data I could ALSO VERY EASILY, and VERY QUICKLY integrate
NON-corporate-ownership data into the VERY SAME graph database, simply
because graphs are, mathematically, so easy to extend and merge.

And so I VERY quickly and VERY easily did EXACTLY THAT - I integrated this
ownership data with marketing data for all companies and their subsidiaries,
AND FCC filing data, AND location data, AND even trade data - ALL into the one
VERY highly-inter-connected Linked Data database.

And from there I could then visualize not only this hierarchical ownership
structure, showing the relationships between subsidiaries (which was all the
existing D&B systems could do, albeit VERY SLOWLY (and they only visualized it
as a TREE, not a GRAPH!)), but now I could also show how they related in terms
of physical location, AND in terms of FCC filings, AND in terms of marketing
leads, AND in terms of trade volumes.

So I could certainly talk at MUCH greater length about JUST this one
particular project at D&B, but in short it was this work that led DIRECTLY to
my personally moving from D&B to join Mastercard...

## Use-case: Vocalink - Fraudulent Money Mule Networks

[Slide 6](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide6-UseCase-Vocalink.png)

...and NOT coincidentally at all, by the way(!), it was Mastercard that also
helped kick-start the entire Solid project, via a $1M donation to Sir Tim
while Tim was still at MIT in 2015 (I've provided a link there to the public
press release).

So, Vocalink was a $920M acquisition for Mastercard in 2016, and basically
Vocalink acts as a clearing house for all bank transactions RIGHT across the
entire UK banking system.

And immediately after the acquisition Vocalink asked Mastercard for assistance
in developing insights from some core fraud data they had.

In short, by mapping this fraudulent transaction data into Linked Data, and
storing it all in a graph database, we could very easily trace fraudulent
transactions THROUGHOUT the entire UK banking system (whereas previously, each
bank's network was an isolated silo for JUST THEIR transactions).

We could easily identify accounts being used to funnel stolen funds from
'victim' accounts, through 'money mule' accounts, and ultimately out of the
banking system via 'endpoint' accounts, and these are the variously colored
circles, or nodes, that you see in this visualization.

And literally, by just visualizing this resulting graph, major criminal
networks were IMMEDIATELY identified and reported to the UK authorities.

But this visualization actually highlights another huge TECHNICAL benefit of
graph databases - which is their ACID-compliant transactional nature. This
meant that the system could monitor fraudulent activity in near real-time, and
in the animated GIF here in the bottom-right we can see the visualization
dynamically updating, even while deeper analysis is being carried out.

So these graph-based capabilities became a major differentiator for Vocalink,
and this resulting visualization was actually demonstrated at financial
conferences worldwide, which is why I can show it here now today.

(And just a couple of quick anecdotes - but when Ajay Banga, the global CEO of
Mastercard first saw this visualization, his immediate response was: "I love
the Electric JellyFish!", which is what it looks like when you click-and-drag
any node around the screen, as all that node's connections 'flow' with it, like
the tentacles of a jellyfish!

I think that's just a really nice example of the POWER of graphs to
communicate so INTUITIVELY - again going back to the reasons for the rapidly
growing adoption of graph technology today - i.e., Graphs simply model reality
better for many real world use-cases.

And likewise, the CEO of Vocalink asked if he could get this visualization
running on his iPhone - literally so that he could show it to other CEO's
while out playing golf!

## Use-case: Mastercard and NGOs - Pamoja (2nd in World Bank competition)

[Slide 7](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide7-UseCase-Mastercard-Pamoja.png)

Ok, so this third, and final, Enterprise example, again from my time at
Mastercard, yet again came about due to the inherent frustrations caused by
the classic 'data silo problem'!

This time, 6 of the world's biggest NGO's collectively approached Mastercard
for assistance with their well-worn, well-understood 'personal
RE-registration' problem.

This is where a refugee, or any victim in a natural disaster, who may have no
formal form of identity whatsoever, needs to register and re-register and
re-register again and again with multiple NGOs individually. Each registration
process requires the individual to provide basically THE SAME INFORMATION
during, on average, a 90-minute interview process, all of which results in
literally millions of wasted man-hours annually.

Initially the solution was assumed to be just the standard, traditional one -
i.e., Mastercard would host a great big database in the cloud, and all the
NGOs would read and write to and from that single master database.

Now sure, that would have solved the surface problem for the NGO's, but on the
Monday morning of Mastercard's week-long workshop on this project, I asked the
simple question - 'WHO are we trying to solve this problem for - the NGO's, or
the refugees?'.

Now, it took a bit of pestering on my part, but long story short, by the
Thursday afternoon of that week the idea of giving each individual refugee
their OWN personal database (i.e., a Solid Pod) really began to take hold, as
it sank in that user-centric Pods would allow those refugees to grant not only
ANY NGO, but also ANY shopkeeper, or ANY micro-finance provider, etc., access
to all the data they needed to provide their services.

This idea became the Pamoja project (meaning 'Altogether' in Swahili), and
the idea REALLY took off within the NGO's themselves (as it so clearly fit
their remit to serve the individual).

Separate pilots were then agreed with the Red Cross, and then jointly with
Oxfam and WorldVision, but then, again long story short, but basically I left
Mastercard and joined Inrupt.

My final involvement with Pamoja however was to enter it as the JOINT Inrupt
and Mastercard entry in the World Bank's first ever "Mission Billion
Challenge" in 2019. This annual challenge is to address digital identity in
the developing world, and had 170 entries from 54 countries.

Now, Solid actually only came 2nd in that competition, so I don't really want
to talk any more about that :) ! And explaining the reasons we only came 2nd
would require pints in the pub later...

## Visualizing a Pod

[Slide 8](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide8-VisualizingAPod.png)

And so finally, if we have time, I'd like to finish with a practical
demonstration of Linked Data, by quickly walking you through an interactive
navigation of an example Solid Pod - in this case just a Pod I created
containing dummy data about things I own, transactions I've made, dummy blog
entries I've written, etc.

But before jumping into that, I'd just like to wrap up what I've taken you
through so far...

## Wrap up...

[Slide 9](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide9-WrapUp.png)

So we've gone through:

- The original Vision behind Linked Data.
- Shown the growing adoption of Graph technology across all industries.
- We walked through 3 real-world examples from Enterprise.
- And we'll walk through a live navigation of Linked Data in a Pod...

The big idea here was to demonstrate the ability of graphs to FAR MORE EASILY
integrate multiple data sources, by expressing the data from each source as
Linked Data, and storing the data from those multiple sources as a single,
inter-connected graph in Solid Pods.

This allows Pod owners to view, query, interact with, and manage all their
data as a single, integrated graph - as opposed to today, where they can
only ask questions and manipulate subsets of their data in isolation.

In other words, users can treat all THEIR data as a single, coherent,
USER-CENTRIC Knowledge Graph.

And being completely STANDARDS-BASED and INTER-OPERABLE, they are also
completely free to add endless more sources of data from their lives, to
provide themselves with ever-richer and deeper insights into, and more control
over, their digital lives.

So I hope that whistle-stop tour of graphs, Linked Data, interoperability,
standards, and the Web itself, helps in framing the fundamental importance of
Linked Data to the overall vision for Solid.

Thank you!
