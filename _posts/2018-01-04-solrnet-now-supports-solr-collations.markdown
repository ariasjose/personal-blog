---
layout: post
title:  "SolrNet Now Supports Solr Collations"
date:   2018-01-04 18:00:00 -0600
categories: [Programming]
tags: [NET, C#, Solr, SolrNet]
---

<p class="intro"><span class="dropcap">O</span>ne
of the spell checking features that comes with Solr 
is called collations. But what are collations useful for?
Think of them like recommendations given by Solr when 
no results are returned for your query, it is not guaranteed 
that they will be the best recommendations or the ones 
that you might be expecting but they are definitely, a 
good resource to look at when your query doesn’t return any documents.
</p>

### Solr SpellCheck Component
As the Solr website states, [SpellCheck][SpellCheck]{:target="_blank"} 
is a component that provides suggestions based on 
the similar terms for the query you are executing. 
These recommendations are mainly retrieved from 
a field in your index, a text file or other indexes.

One of the parameters that spellcheck component 
takes is spellcheck.collate which enables Solr to 
provide suggestions for every term in your query. 
These suggestions are used to build a new query (or more) 
provided with the number of hits if it is executed. 
It is important to mention that the suggestions 
aren’t executed which might have a performance impact.

### SolrNet
[SolrNet][SolrNet]{:target="_blank"} is a .NET library 
that enables you to use Solr hiding all the complexity 
of parsing the XML or JSON formats decreasing considerably 
the time taken to build a search based application.

One of the drawbacks of this library was that it didn’t 
support the use of this amazing feature. Fortunately, 
a [new version][SolrNetNewVersion]{:target="_blank"} 
has been released 4 days ago and my changes for supporting 
collations have been incorporated and now collations are 
one of its new features.

Take some time to review this feature and see 
how much you can benefit from it.


[SpellCheck]: https://lucene.apache.org/solr/guide/7_1/spell-checking.html
[SolrNet]: https://github.com/SolrNet/SolrNet
[SolrNetNewVersion]: https://github.com/SolrNet/SolrNet/blob/master/changelog.md
