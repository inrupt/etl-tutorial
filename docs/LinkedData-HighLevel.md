# How Solid Stores Data

This article talks about one of the cornerstones of the ENTIRE Solid proposition - which is,
how Solid stores data.

Solid actually uses a very mature, fully W3C-standardized technology called LINKED DATA,
and here I'd specifically like to talk about it's applicability to Enterprises.

So, what is "Linked Data"?

## What is Linked Data?

[Slide 2](./LinkedDataSlidedeckImage/Slide2-TimsTedTalk2009.png)

Well, the term itself was originally coined by Sir Tim Berners-Lee back in 2006,
and was accelerated by this Ted-talk given by Tim in 2009.

Tim introduces this talk by explaining how he was driven to invent the World Wide Web
by his ongoing frustrations with NON-INTEROPERABLE systems, and NON-STANDARD data formats -
in other words, from having to deal with lots and lots of DIFFERENT SILOES
(and that's something I hope sounds at least VAGUELY familiar even today, some 32 years later!).

Tim goes on to explain that his original vision for the Web was always to make
INDIVIDUAL PIECES OF DATA interoperable and shareable on the Web - and not really the more
coarse-grained DOCUMENTS, or WEB PAGES that have made up the bulk of the Web to-date.

And so Tim coined the phrase "Linked Data" as a way to help try and re-frame the Web, back to his
original intent of sharing, and linking together, INDIVIDUAL PIECES OF DATA.

Tim continues in the talk by describing some very simple rules to allow exactly that -
to inter-link data across the entire Web, all the while being based on open, inter-operable STANDARDS
(which REMAINS today a fundamental principle underlying the success of the entire Web).

So in effect, the term "Linked Data" refers to ANY data that is expressed following these simple rules that,
in very simplistic terms, define "Graph data on the Web".

And that's it really - but what do I mean by "Graph Data" here?

## What do we mean by Graphs?

[Slide 3](./LinkedDataSlidedeckImage/Slide3-GraphMotifEverywhere.png)

Well, I DON'T mean line graphs, or pie charts, or histograms - not those types of graph.

Instead I just mean the EXTREMELY familiar "CIRCLES WITH LINES LINKING THEM TOGETHER" type
of graph - or, in other words, a 'NETWORK', or a 'WEB'!

Now this image, or motif, of "CIRCLES AND LINES LINKING THEM" is becoming more and
more ubiquitous today, as I'd hope you'd all agree - and, I'd argue, for VERY good reason.

In the bottom right here, we show a simple Google IMAGE search, JUST for the single word - 'NETWORK',
but even an image search for the single word "TECHNOLOGY" shows just how ubiquitous this notion
of "CIRCLES WITH LINES LINKING THEM" has become in modern life - I mean, it's literally everywhere!

And I believe that the main reason for this is simply that EVERYONE (corporations, and individuals alike)
are becoming INCREASINGLY aware that everything really is, and always has been,
inter-connected, and inter-linked.

So certainly Facebook and LinkedIn have popularized this concept for the masses, right?,
since we all naturally refer to our NETWORK of friends, or our NETWORK of work colleagues,
but in a very real sense (and most certainly in a 'DATA' sense),
the day-to-day operations of any company, or even YOUR PERSONAL life as an individual,
INHERENTLY FORMS A GRAPH - in other words, its "CIRCLES WITH LINES INTER-LINKING THEM",
be it a company's supply-chain NETWORK (which is really just an inter-connected graph of suppliers),
or your customers recommending the your range of power tools, or lawn
furniture to their NETWORK of family and friends - everything together forms a graph.

And as I say, Enterprises have been realising this inherent INTER-CONNECTED-NESS, both of their
internal systems, but also across all their customer relationships too...

## Adoption of Graph Technology

[Slide 4](./LinkedDataSlidedeckImage/Slide4-RisingGraphTechAdoption.png)

And so on this slide I highlight the rapidly rising adoption of Graph technology across the entire industry,
starting on the left with graph database adoption over the past 8 years or so.

These graph databases are typically used to drive Knowledge Graphs, or to perform graph analytics (or both),
and on the right side here we show the household-name Enterprises that have already PUBLICLY adopted
Knowledge Graphs to help drive their businesses - the likes of Google, Facebook,
the BBC, Walmart, Amazon, etc.

And the rise of Knowledge Graphs generally is due to the recognition that to understand any complex
thing (be that an internal Enterprise system, or any individual customer), you need to see,
connect and thereby understand all the interactions that that thing has across your entire organization
(this is regularly referred to now as getting a 360-degree-view of the customer for example).

Finally we reference a short quote from Gartner to illustrate just how BROADLY the potential of
graphs is now being recognized.

So to help illustrate all this a bit more TANGIBLY,
I'd like to quickly illustrate just TWO real-world examples from my own personal
experience of using Linked Data in Enterprises...

## Use-case: D&B - Corporate Ownership Structure

[Slide 5](./LinkedDataSlidedeckImage/Slide5-UseCase-DNB.png)

First I'm showing an open-source endeavour from Open Corporates,
who aim to be "The largest OPEN database of companies in the world".

Now, I show this as an example of VERY SIMILAR work I did as an architect with Dun&Bradstreet (D&B),
as unfortunately I can't show the D&B work itself, as it wasn't demonstrated publicly.

D&B, as you might know, sell reports on companies, detailing things like a company's creditworthiness,
or it's risk of going out of business.

And as the technical architect for D&B's first venture into Corporate Compliance, I introduced
Linked Data and graph databases to demonstrate how DRASTICALLY MORE efficiently graphs can represent
"Corporate Ownership" information, which simply means what companies own what companies own
what companies, etc. - in other words, a company's sub-siduaries and it's parents.

This is a crucial consideration for Corporate Compliance, as having one of YOUR company directors
be a director of a supplier (or of a supplier's subsiduary) can lead to serious
conflict-of-interest violations.

And that's what we see Open Corporates visualizing here - this is the Corporate Ownership structure of
JP Morgan from a single subsiduary's perspective.

Anyway in short, not only did using graph technology offer an immediate 15-TIMES performance improvement
over D&B's existing Oracle-based solutions,
but CRITICALLY, expressing that information as Linked Data ALSO allowed me to
EASILY integrate NON-corporate-ownership data into the very same graph database.

And so I very quickly and easily integrated this ownership data with marketing data,
AND FCC filing data, AND location data, AND even trade data - all into the one graph database.

And from there I could then visualize not only the hierarchical ownership relationships between
sub-siduaries (which was all the existing D&B systems could do), but also how they
related in terms of physical location, FCC filings, marketing leads, AND even trade volumes.

So I could certainly talk at great length about JUST this one particular project at D&B, but in short
it was this work that led DIRECTLY to my moving to Mastercard...

## Use-case: VocaLink - Fraudulent Money Mule Networks

[Slide 6](./LinkedDataSlidedeckImage/Slide6-UseCase-VocaLink.png)

...and NOT coincidentally at all, it was Mastercard that also helped kick-start the entire Solid project, via
a $1M donation to Sir Tim at MIT in 2015. But unfortunately, that's far too long an anecdote
to describe in this short presentation I'm afraid!

So VocaLink was a $920M acquisition for Mastercard in 2016.
VocaLink acts as a clearing house for bank transactions right across the UK, and
immediately after the acquistion they asked Mastercard for assistance in developing insights
from some core fraudulent transaction data they had.

In short, by converting their fraudulent transaction data into Linked Data, and
storing it all in a graph database, we could trace each transaction throughtout the entire UK banking
system (whereas previously, each bank's network was an isolated silo).
We could thereby identify accounts being used to funnel stolen funds from 'victim' accounts,
through 'money mule' accounts, and ultimately out of the banking system via 'endpoint' accounts,
which are the various colored nodes in this visualiation.

And by simply visualizing the resulting graph, major criminal networks were almost immediately
detected and reported to the UK authorities.

But the transactional nature of graph databases ALSO meant that
the system could monitor fraudulent activity in near real-time,
and in the animated GIF we can see the visualization dynamically updating even
while deeper analysis is being carried out.

These graph-based capabilities became a major differentiator for VocaLink, and the resulting
visualization here was demonstrated at financial conferences worldwide.

So how are we looking to introduce Linked Data generally?

## General approach to customer Proof of Concepts (PoC)

Well, the idea is to demonstrate the ability of graphs to far more easily
integrate multiple data sources, by expressing the data from each source as
Linked Data, and storing the data from multiple sources as a single,
inter-connected graph in a Solid Pod.

This allows those Pod owners to view, query, interact with, and manage all
their data as a single, integrated graph - as opposed to today, where they can
only ask questions of each data source in isolation.

So in other words, pulling multiple CURRENTLY disparate data sources together
provides a Pod owner with a single, consolidated view of their entire life,
via a FULLY STANDARDIZED Solid Pod.

As a result, Pod owners can treat their personal data as the basis for a single,
coherent, USER-CENTRIC Knowledge Graph.

And being completely STANDARDS-BASED and INTEROPERABLE, they are also
completely free to endlessly add more sources of data from their lives, to
provide them with ever-richer and deeper insights into, and more control over,
their digital lives.

So, I hope that whistle-stop tour of graphs, Linked Data, interoperability,
standards, and the Web itself, helps in framing the overall ambitions for Solid.
