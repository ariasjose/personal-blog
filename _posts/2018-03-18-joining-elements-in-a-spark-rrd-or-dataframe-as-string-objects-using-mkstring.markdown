---
layout: post
title:  "Joining Elements In A Spark RDD Or DataFrame As String Objects Using MkString"
date:   2018-03-18 18:00:00 -0600
categories: [Programming]
tags: [Scala, Spark]
---

<p class="intro"><span class="dropcap">H</span>i
there! I’ve been involved in a project where the 
main goal is to get more than 5 people certified in Spark.
</p>

One of the things that I’ve seen they do a lot 
(and so did I when I was studying for the same purpose) 
is trying to convert either an RDD or Data Frame as a 
String value from their elements in a row.

So, you might think that the easier way to do it is by 
joining the values using the overloaded + operator of 
the String class. That approach can be seen in the 
following example where a parallelized list is being 
created to simulate reading data from a file (it might 
be a Hive table or data in another format) where the 
values are separated by a pipe sign “|”. Then we are 
creating comma-separated string values that we might 
want to store to, let say, a csv file.

{% highlight scala %}
//Simulate data loaded from some storage
var list = Seq("Row1Col1|Row1Col2|Row1Col3", "Row2Col1|Row2Col2|Row2Col3")
var parallelizedList = sc.parallelize(list)
 
//Join the values using + operator
var listAsString = parallelizedList.map(r => {
      var lineSplit = r.split('|')
      lineSplit(0) + "," + lineSplit(1) + "," + lineSplit(2)
    })
 
//...Save listAsString to a file
{% endhighlight %}

Imagine what would happen if you have 10 columns 
of more, yes, you would have to reference those 
columns making a very long statement.

Next example will show you a nicer and easier 
way to join the columns using a string character 
as a separator. As we want to save the file in 
csv format, will use the comma “,” character 
as the separator.

{% highlight scala %}
//Join the values using + operator
var listAsString = parallelizedList.map(r => r.split('|').mkString(","))
 
//...Save listAsString to a file
{% endhighlight %}

Now you have learned a tip that may be useful for your future Spark projects using Scala.
