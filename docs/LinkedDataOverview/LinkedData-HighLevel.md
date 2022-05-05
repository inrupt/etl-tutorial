# How Solid Stores Data

This article talks about one of the cornerstones of the ENTIRE Solid
proposition - which is, how Solid represents and stores data.

So Solid actually uses a VERY mature, fully W3C-standardized technology called
LINKED DATA, and here I'd like to specifically talk about Linked Data's GENERAL
applicability to Enterprises today.

So, what is "Linked Data"?

## What is Linked Data?

[Slide 2](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide2-TimsTedTalk2009.png)

Well, the term itself was originally coined by Sir Tim Berners-Lee back in 2006,
and awareness was accelerated by this Ted-talk given by Tim in 2009.

Tim introduces this talk by explaining how he was driven to invent the World
Wide Web ITSELF by his ongoing frustrations with NON-INTEROPERABLE systems, and
NON-STANDARD data formats, while working at CERN.

In other words, from his having to deal with lots and lots of DIFFERENT SILOES.
Now, that's something that I hope sounds at least VAGUELY familiar even today,
some 33 years later!

In fact, recently ([Feb 2022](https://twitter.com/elonmusk/status/1495901654872383499)),
ELON MUSK posted a tweet complaining about the NIGHTMARE of usernames,
passwords, and 2FA for all the TV streaming services available today.

      <CLICK ON LINK>

But of course, Elon's nightmare is really just down to each of today's streaming
services CONTINUING to be its own silo - basically it's a reflection of Tim's
frustration 33 years ago.

Anyway, in this TED talk, Tim goes on to explain that his original vision
for the Web was always to make INDIVIDUAL PIECES OF DATA interoperable and
shareable on the Web - and not the more coarse-grained DOCUMENTS, or WEB PAGES,
that have made up the bulk of the Web to-date.

And so, in 2006, Tim coined the phrase "Linked Data" as a way to try and
re-frame his original vision, back to his original INTENT of sharing, and
linking together individual PIECES OF DATA.

Tim continues his talk by describing some VERY SIMPLE RULES to allow exactly
that - i.e., to allow DATA to be inter-linked across the entire Web, all the
while being based on open, interoperable STANDARDS (which of course REMAINS
one of fundamental principles that led to the phenomenal success of the Web
itself).

So in effect, the term "Linked Data" simply refers to ANY data that is
expressed following these simple STANDARDIZED rules - rules that, in effect,
define "Graph data on the Web". And I've included a link here to a nice
description of those rules, which have become known as the "5-stars of Linked
Data".

        <CLICK ON LINK>

And so that's Linked Data really - it's just "Graph data on the web".

But in general terms, what do we mean by "Graph Data" in the first place?

## What do we mean by Graphs?

[Slide 3](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide3-GraphMotifEverywhere.png)

Well, I DON'T mean line graphs, or pie charts, or histograms - not ANY of
those types of graph.

Instead I just mean the EXTREMELY familiar "CIRCLES WITH LINES LINKING THEM
TOGETHER" type of graph - or, in other words, a 'NETWORK', or a 'WEB'!

Now this image, or motif, of "CIRCLES AND LINES LINKING THEM" is becoming more
and more ubiquitous today, as I'd hope you'd all agree - and, I'd argue, for
VERY good reason.

In the bottom right here, we show a simple IMAGE search, JUST for the single
word - 'NETWORK'. But the even bigger image to the left is a search for the
single word "TECHNOLOGY", which I think shows just how ubiquitous this notion of
"CIRCLES WITH LINES LINKING THEM" has become in modern life - I mean, it's
literally everywhere, right?

And I believe that the main reason for this is simply because EVERYONE (and I
mean corporations, governments, and individuals alike) are becoming INCREASINGLY
aware that everything is, and always has been, INHERENTLY inter-connected and
inter-linked.

So, certainly Facebook and LinkedIn have popularized this concept for the masses
(right!?), since we all naturally refer now to our NETWORK of friends, or our
NETWORK of work colleagues, but in a very real sense (and most certainly in a
'DATA' sense), all of the day-to-day operations of any enterprise, or even YOUR
OWN PERSONAL LIFE as an individual, INHERENTLY FORMS A GRAPH.

In other words, it's all "CIRCLES WITH LINES LINKING THEM TOGETHER", be it
an Enterprise's supply-chain NETWORK (which is just an inter-connected graph of
suppliers), or that Enterprise's customers recommending their products to their
NETWORK of family and friends - basically everything taken together forms a
graph of "CIRLES AND LINES LINKING THEM".

And as I say, Enterprises have been realising the importance of this inherent
INTER-CONNECTED-NESS, both for their INTERNAL systems, but also across ALL of
their customer relationships too...

## Adoption of Graph Technology

[Slide 4](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide4-RisingGraphTechAdoption.png)

So on this slide I thought I'd highlight the rapidly GROWING adoption of Graph
technology, starting on the left here with Graph DATABASE adoption, over the
past 9 years or so.

So graph databases are typically used to drive Knowledge Graphs, or to perform
graph analytics (or both), and on the right-hand side here we show the
household-name Enterprises that have already PUBLICLY announced using Knowledge
Graphs to help drive their businesses - i.e., the likes of Google, Facebook,
the BBC, Walmart, Amazon, The New York Times, etc., etc.

And this rise in Knowledge Graphs generally is, I BELIEVE, due to this
recognition that to understand ANY complex THING (be that an internal
Enterprise system, or a supplier, or a citizen, or any individual customer),
you need to see, connect and thereby understand ALL the interactions that that
THING has across your entire organization (for example, this is now regularly
referred to as having a 360-degree-view of the customer).

In the bottom right here I've referenced a nice list of the range of
applications that graph databases are ideally suited to address....

        <CLICK ON LINK>
     ...including Fraud detection, network analysis, recommendation engines,
     ...and of course Knowledge Graphs at the end.

And finally I also dropped in here a reference from Gartner, merely to
illustrate just how BROADLY across the entire industry the POTENTIAL for graph
technology is now being recognized.

So, to help illustrate all of this a bit more TANGIBLY, I'd like to quickly
illustrate just THREE real-world examples from my own PERSONAL experience of
using Linked Data in Enterprises...

## Use-case: D&B - Corporate Ownership Structure

[Slide 5](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide5-UseCase-DNB.png)

Firstly I'm showing an open-source endeavour here from Open Corporates, who aim
to be "The largest OPEN database of company information in the world".

Now, I show this as an example of VERY SIMILAR work I did while at Dun &
Bradstreet (D&B) - but since D&B never publicly demonstrated that work,
unfortunately I can't show the actual work itself.

So D&B is one of the oldest American corporations, and it's actually
responsible for issuing the OFFICIAL 9-digit company identifiers for ALL
companies in the United States (identifiers known as DUNS numbers). But D&B
make their MONEY from selling reports on companies, detailing things like a
company's creditworthiness, or it's risk of going out-of-business, etc.

Now, I had the honour of being the Technical Architect for D&B's first product
specifically addressing Corporate Compliance, and I used that opportunity to
introduce Linked Data and graph databases to demonstrate just how DRASTICALLY
MORE efficient graphs can represent "Corporate Ownership" information, which
is simply what companies own what companies own what companies, etc. - in
other words, all of a company's subsidiaries and all of its parents.

Now this structure is a crucial consideration for Corporate Compliance, as, for
example, having one of YOUR company directors also be a director of a supplier
(OR of a supplier's subsidiary, OR any of that supplier's parent companies) can
lead to serious conflict-of-interest violations.

And that's what we see visualized here by Open Corporates. This is the
Corporate Ownership structure of JP Morgan from the perspective of a single
subsidiary, in this case a minor subsidiary based in the Cayman Islands.

Anyway in short, simply switching to a graph database provided an immediate
15-TIMES performance improvement over D&B's existing, EXTREMELY EXPENSIVE,
Oracle databases.

(NOW, JUST QUICKLY FOR THE DEVELOPERS HERE, the reason (which is kinda
self-evident, ONCE YOU'VE DONE IT!) is that performing hundreds, or thousands,
of self-joins on a relational database table is ALWAYS going to be at least AN
ORDER OF MAGNITUDE slower than simply traversing 'hasParent' links in a graph
database, which is all we needed to do here to determine the complete corporate
ownership structure for any company.)

But EVEN MORE CRITICALLY, expressing this Corporate Ownership information as
Linked Data ALSO allowed me to VERY EASILY, and VERY QUICKLY integrate
NON-corporate-ownership data into the VERY SAME graph database.

And so I VERY quickly and VERY easily DID integrate this ownership data with
marketing data for all companies and their subsidiaries, AND FCC filing data,
AND location data, AND even trade data - ALL into the one VERY
highly-inter-connected graph database.

And from there I could then visualize not only the hierarchical ownership
structure, showing the relationships between subsidiaries (which was all the
existing D&B systems could do, albeit VERY SLOWLY, and they only visualized it
as a TREE, not a GRAPH!), but now I could also show HOW they related in terms
of physical location, AND in terms of FCC filings, AND in terms of marketing
leads, AND even in terms of trade volumes.

So I could certainly talk at MUCH greater length about JUST this one
particular project at D&B, but in short it was this work that led DIRECTLY to
my personally moving to Mastercard...

## Use-case: VocaLink - Fraudulent Money Mule Networks

[Slide 6](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide6-UseCase-VocaLink.png)

...and NOT coincidentally at all, by the way(!), it was Mastercard that also
helped kick-start the entire Solid project, via a $1M donation to Sir Tim
while Tim was still at MIT in 2015 (I've provided a link there to the public
press release).

But unfortunately, that's FAR too long an anecdote to go into for this short
presentation - it's more a story for the pub, over pints of Guinness I'm
afraid!

So, VocaLink was a $920M acquisition for Mastercard in 2016, and basically
VocaLink acts as a clearing house for all bank transactions RIGHT across the
entire UK banking system.

And immediately after the acquisition Vocalink asked Mastercard for assistance
in developing insights from some core transaction-fraud data that they had.

In short, by mapping this fraudulent transaction data into Linked Data, and
storing it all in a graph database, we could easily trace each fraudulent
transaction throughout the entire UK banking system (whereas previously, each
bank's network was an isolated silo of JUST THEIR transactions).

We could thereby VISUALLY identify accounts being used to funnel stolen funds
from 'victim' accounts, through 'money mule' accounts, and ultimately out of
the banking system via 'endpoint' accounts, and these are the variously
colored nodes you see in this visualization.

And by simply visualizing the resulting graph, major criminal networks were
IMMEDIATELY identified and reported to the UK authorities.

But this visualization actually highlights another huge TECHNICAL benefit of
graph databases - which is their ACID-compliant transactional nature. This
meant that the system could monitor fraudulent activity in near real-time, and
in the animated GIF here in the bottom-right we can see the visualization
dynamically updating, even while deeper analysis is being carried out.

So these graph-based capabilities became a major differentiator for VocaLink,
and this resulting visualization was actually demonstrated at financial
conferences worldwide, which is why I can show it here now.

(And just a couple of quick anecdotes - but when Ajay Banga, the global CEO of
Mastercard at the time, first saw this visualization, his response was: "I
love the Electric JellyFish!", which is what it like when you click-and-drag a
node around the screen, as all that node's connections 'flow' with it, like
the tentacles of a jellyfish!

And the CEO of Vocalink asked if he could get this visualization running on
his iPhone, literally so that he could show it to other CEO's while out
playing golf!

So, I think those are just a couple of really nice examples of the POWER of
graphs to communicate so INTUITIVELY - again going back to the reasons for the
rapidly growing adoption of graph technology!)

## Use-case: Mastercard and NGOs - Pamoja (2nd in World Bank competition)

[Slide 7](docs/LinkedDataOverview/LinkedDataSlidedeckImagenkedDataSlidedeckImage/Slide7-UseCase-Mastercard-Pamoja.png)

Ok, so this third, and final, Enterprise example, again from my time at
Mastercard, yet again came about due to the inherent frustrations caused by
the classic 'siloed data problem'!

This time, 6 of the world's biggest NGO's collectively approached Mastercard
for assistance with their well-worn 'personal RE-registration' problem.

This is where a refugee, or any victim in a natural disaster, needs to register
and re-register again, over and over, with multiple NGOs individually. On
average, each registration requires the individual to provide THE SAME
INFORMATION during a 90-minute interview process, all resulting in literally
millions of wasted man-hours annually.

Initially the solution was assumed to be just the standard, traditional one -
i.e., Mastercard would host a great big database in the cloud, and all the NGOs
would read and write to and from that master database.

Sure, that would have solved the surface problem for the NGO's, but on the
Monday morning of Mastercard's week-long workshop on this problem, I asked the
simple question - 'WHO are we trying to solve this problem for - the NGO's, or
the refugees?'.

Now, it took a bit of pestering on my part, but long story short, by the
Thursday afternoon of that week the idea of giving each refugee their OWN
personal database (i.e., a Solid Pod) really began to take hold, as it sank in
that that Pod would allow those refugees to grant any NGO (or ANY shopkeeper,
or ANY micro-finance provider, etc.) access to all the data that they
generally needed to register to receive ANY service.

This idea became the Pamoja project (meaning 'Altogether' in Swahili), and
again long story short, the idea REALLY took off within the NGO's themselves
(as it so clearly fit their remit to serve individuals).

Separate pilots were then agreed with the Red Cross, and then jointly with
Oxfam and WorldVision - but then I left Mastercard and joined Inrupt.

My final involvement with Pamoja though was to enter it (as a JOINT Inrupt
and Mastercard entry) in the World Bank's first ever "Mission Billion
Challenge" in 2019. This annual challenge is to address digital identity in
the developing world, and had 170 entries from 54 countries.

Now, Solid actually only came 2nd, so I don't really want to talk any more
about that (although the reasons we only came 2nd is another long anecdote for
the pub!).

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
- Shown the growing adoption of Graph technology across the industry.
- Walked through 3 real-world examples from Enterprise.
- And we will walk through a live navigation of Linked Data in a Pod.

The big idea here was to demonstrate the ability of graphs to FAR MORE EASILY
integrate multiple data sources, by expressing the data from each source as
Linked Data, and storing the data from those multiple sources as a single,
inter-connected graph in Solid Pods.

This allows those Pod owners to view, query, interact with, and manage all
their data as a single, integrated graph - as opposed to today, where they can
only ask questions and manipulate subsets of their data in isolation.

In other words, users can treat all their data as a single, coherent,
USER-CENTRIC Knowledge Graph.

And being completely STANDARDS-BASED and INTER-OPERABLE, they are also
completely free to add endless more sources of data from their lives, to
provide themselves with ever-richer and deeper insights into, and more control
over, their digital lives.

So I hope that whistle-stop tour of graphs, Linked Data, interoperability,
standards, and the Web itself, helps in framing the fundamental importance of
Linked Data to the overall vision for Solid.

Thank you!
