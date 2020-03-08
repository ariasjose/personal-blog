---
layout: post
title:  "Generate Books Suggestions Using Spark Collaborative Filtering Approach (Mllib ALS Algorithm Implementation)"
date:   2018-06-18 18:00:00 -0600
categories: [Programming]
tags: [Hadoop, Machine Learning, Spark]
---

<p class="intro"><span class="dropcap">C</span>ollaborative
filtering is the process of helping us 
finding recommendations or making predictions for a 
given user or users based on their preferences and 
the preferences of other users that like or have a 
taste for similar items.
</p>

In this post, I’ll show you how to use the 
[Spark mllib ALS algorithm implementation][sparkals]{:target="_blank"}
so that can be used to generate a matrix factorization 
model and provide books recommendations based on Amazon 
users’ reviews.

This post will cover the following:

* Extract and transform raw data and ingest the 
content to Spark
* Describe the data
* Generate a model to make predictions and generate 
suggestions using Spark ALS algorithm implementation
*Test our model accuracy using the mean absolute 
error (MAE)

### Collaborative Filtering
The basic idea of collaborative filtering is to find 
similarities between users and then use their preferences 
to recommend products to similar users. People that like 
the same items are most likely to have the same preferences. 
Alternative least squares (ALS) is an algorithm that helps 
us to find hidden values or factors in a matrix of users 
and their preferences for a given set of products and users.

Take the below matrix as an example, it would be easy to 
say that Lu will likely like movie C and that her rating 
would be high as Frank and Max share the same preferences. 
Imagine this at large scale where many users’ characteristics 
are taken into consideration.

<figure>
	<img src="{{ '/assets/img/2018/06/users-products-matrix.png' | prepend: site.baseurl }}" 
    alt="Users Products Matrix"> 
	<figcaption>Users Products Matrix</figcaption>
</figure>

Typical machine learning cycle goes from extracting and 
transforming the data so it can be processed by Spark 
engine or any other big data framework and build a model 
using the data collected but leaving a small dataset to be 
used in a testing phase where predicted and real values 
are compared. The training/test phase is a continuing 
cycle until you feel confident that your model is enough 
precised to predict.

<figure>
	<img src="{{ '/assets/img/2018/06/ml-cycle.png' | prepend: site.baseurl }}" 
    alt="Machine Learning Cycle"> 
	<figcaption>Machine Learning Cycle</figcaption>
</figure>

### Exploring The Data
For these project, I’ll be using Amazon books reviews 
data collected by an awesome guy for his paper and posted 
[here][amzdata]{:target="_blank"}. 
Data is very large so I’ll be using the small dataset 
containing only books reviews and metadata. Both the 
ratings and metadata files have been modified to have 
only records with a valid title and books identifiers in 
both files.

<figure>
	<img src="{{ '/assets/img/2018/06/ratings.png' | prepend: site.baseurl }}" 
    alt="Ratings file format"> 
	<figcaption>Ratings file format</figcaption>
</figure>

<figure>
	<img src="{{ '/assets/img/2018/06/metadata.png' | prepend: site.baseurl }}" 
    alt="Metadata file format"> 
	<figcaption>Metadata file format</figcaption>
</figure>

The first thing to do would be loading the data in 
memory from CSV file containing the reviews and 
converting it to a dataframe.

{% highlight scala %}
//Import books ratings (userId, productId, rating) - user and product ids are alphanumeric
val booksRdd = sc.textFile(path="/amz/ratingsBooks.csv").map( r => {
    val values = r.split(',')
    (values(0), values(1), values(2))
})
 
//Convert to DF
import sqlContext.implicits._
val booksDF = booksRdd.toDF(colNames = "userId", "productId", "rating")
{% endhighlight %}

As users and books ids are alphanumeric will use StringIndexer 
and Pipeline classes to map these values to an integer representation. 
Spark ALS implementation expects this data types. 
This process will generate two additional columns 
that will be unique identifiers for users and products.

{% highlight scala %}
//Create string indexers to map alphanumeric to Int as Rating class expects Int
//types for user and product ids
val strIndexerForUser = new StringIndexer()
                          .setInputCol("userId")
                          .setOutputCol("userIdInt")
val strIndexerForProduct = new StringIndexer()
                            .setInputCol("productId")
                            .setOutputCol("productIdInt")
 
val pipeline = new Pipeline()
                 .setStages(Array(strIndexerForUser, strIndexerForProduct))
val pipelineModel = pipeline.fit(booksDF)
val booksDFWithIdsMapped = pipelineModel.transform(booksDF)
 
booksDFWithIdsMapped show 5
//+--------------+----------+------+---------+------------+                       
//|        userId| productId|rating|userIdInt|productIdInt|
//+--------------+----------+------+---------+------------+
//|A3CW0ZLUO5X2B1|1439171300|   1.0|   4658.0|     27444.0|
//|A2D7B5I7ZQ51XL|1439171300|   3.0|  16100.0|     27444.0|
//|A34A7QEBMYTALW|1439171300|   1.0|  19403.0|     27444.0|
//|A3CA3RWZYJDWXE|1439171300|   3.0|   2464.0|     27444.0|
//|A2F6N60Z96CAJI|1439171300|   5.0|      2.0|     27444.0|
//+--------------+----------+------+---------+------------+
{% endhighlight %}

Now that we have our data ready, let’s start creating 
an RDD of Rating objects and persist it as we’ll use 
it later. This concludes our ETL phase.

{% highlight scala %}
val booksRatingsRdd = booksDFWithIdsMapped.map( r => {
    Rating(
        r.getAs[Double]("userIdInt").toInt,
        r.getAs[Double]("productIdInt").toInt,
        r.getAs[String]("rating").toDouble
    )
}).cache
{% endhighlight %}

We also want to describe the data we have to build our model.

{% highlight scala %}
val totalOfReviews = booksRatingsRdd.count
val totalReviewers = booksRatingsRdd.map(_.user).distinct.count
val totalBooks = booksRatingsRdd.map(_.product).distinct.count
println(s"Total Reviews: $totalOfReviews; Total Reviewers: $totalReviewers; Books rated: $totalBooks")
 
//Total Reviews: 7429119; Total Reviewers: 600631; Books rated: 286303
{% endhighlight %}

### Training And Test Phases
Next phase will be the training phase. In this stage, 
we want to create our model based on the reviews provided 
by the users. At this point, we want to take 80% of our 
reviews to build the model and 20% of the data to test 
it and see how efficient it is.

{% highlight scala %}
//Split ratings RDD: training data = 80%; test data = 20% 
val ratingsSplit = booksRatingsRdd.randomSplit(weights=Array(0.8, 0.2), seed=0L) 
val trainingDataRdd = ratingsSplit(0).cache 
val testDataRdd = ratingsSplit(1).cache 
 
//Display training and test data 
val trainingSize = trainingDataRdd.count 
val testSize = testDataRdd.count 
println(s"Training size: $trainingSize; Test size: $testSize") 
 
//Training size: 5944348; Test size: 1484771
{% endhighlight %}

ALS train method will return a matrix factorization 
model that we’ll use later to make predictions.<br>
This method requires some parameters, here’s are 
the most important ones:

* ratings = RDD of Rating objects to train and build the model
* rank = number of hidden latten factors
* iterations = number of iterations, usually converges at 20
* lamba = a regularization constant

I’ll be using some values I think will be good for 
building our model but this is something that needs 
to be improved using different sets of combinations 
to find the best one.

{% highlight scala %}
//Train and create the matrix factorization model
val _rank = 5
val iterations = 20
var lambda = 0.01
val matrixModel = ALS.train(trainingDataRdd, _rank, iterations, lambda)
{% endhighlight %}

Now that we have our model we need to use our test data 
to measure how accurate it is. We’ll start by asking 
our model to suggest (predict) some books to our test 
data users. Then we’ll compare these predictions against 
the real user’s preferences.

For doing this we’ll create two RDDs with the structure 
((user, product), rating). This will let us join the 
data to obtain an RDD of users and products with their 
respective predicted and real ratings to then validate 
our model precision for making predictions.

{% highlight scala %}
//Make predictions using the model for the test data
val predictionsForTestData = matrixModel.predict(
    testDataRdd.map(r => (r.user, r.product))
)
 
//Validate our model by comparing predicted and actual ratings for test data users
//Will use join to merge our results and then validate our model using Mean Absolute Error
val predictedRatingsRdd = predictionsForTestData.map( r => ((r.user, r.product), r.rating))
val testDataRatingsRdd = testDataRdd.map( r => ((r.user, r.product), r.rating))
 
//(user, product), (ratingP, ratingT)
val predictedAndActualRatingsRdd = predictedRatingsRdd.join(testDataRatingsRdd)
{% endhighlight %}

We’ll use [mean absolute error (MAE)][mae]{:target="_blank"}
to find a number that tells us how close or far are 
the model’s predictions from the real values. 
What MAE basically does is to find the distance 
between 2 variables values -in our case, these 
values are the predicted rating value for a given 
book and the real value given by the user- and 
then calculate the mean for those distances.

{% highlight scala %}
//Get the MAE and display it - The lower the MAE the better the model
val mae = predictedAndActualRatingsRdd.map({
    case ((user, product), (ratingP, ratingT)) => math.abs(ratingP - ratingT)
}).mean
println(s"MAE for our model: $mae")
 
//MAE for our model: 1.2299502740398007
{% endhighlight %}

It’s a common practice in statistics to remove 
[false positives][falsepositives]{:target="_blank"}. 
In our case, we’ll remove predicted ratings equal or 
greater than 4 where actual values were less or equal 
to 1. Then we’ll calculate the MAE for remaining predictions.

{% highlight scala %}
//Calculate MAE removing false positives
val predictedAndActualRatingsRddWithoutFP = predictedAndActualRatingsRdd.filter({
  case ((user, product), (ratingP, ratingT)) => ratingT > 1 || ratingP < 5
}) 
val maeNoFP = predictedAndActualRatingsRddWithoutFP.map({ 
  case ((user, product), (ratingP, ratingT)) => math.abs(ratingP - ratingT)
}).mean
 
println(s"MAE for our model removing false positives: $maeNoFP")
 
//MAE for our model removing false positives: 1.2124496499912303
{% endhighlight %}

This probes the efficiency of our model using MAE method. 
The closer the value to zero the better our model is. 
This concludes our testing phase.

You can find the code used in this blog on [GitHub][githubcode]{:target="_blank"}. 
Additionally, you can use this code on your windows 
machine using Spark standalone installation as described 
[here]({{ site.baseurl }}
{% post_url 2018-04-02-how-to-install-spark-1-6-2-on-a-windows-10-x64-machine %}).

### Additional Content
Now we have our model tested and ready to be used. 
We’ll show some recommendation to a random user.

As we saw earlier in this blog we had to convert 
the user ids to an integer representation. 
Now we’ll create a map to easily get the real 
user id and show it.

{% highlight scala %}
//Get the actual mapping for users and products
val usersMap = booksDFWithIdsMapped.map( r => {
  (r.getAs[Double]("userIdInt").toInt, r.getAs[String]("userId"))
}).distinct.collectAsMap
{% endhighlight %}

Let’s do the same with products. Going further, 
we’ll load the books metadata to not only show 
the product id but the title.

{% highlight scala %}
//As we haven't loaded the products let's create a Rdd of products (id, title)
val productsRdd = sqlContext.read.json(path="/amz/metaBooks.json").map( r => {
  (r.getAs[String]("asin"), r.getAs[String]("title"))
})
 
//(id, idInt) join (id, title) =&amp;amp;amp;amp;amp;gt; (id, (idInt, Title)) => (idInt, (idTitle))
val productsMap = booksDFWithIdsMapped.map( r => {
  (r.getAs[String]("productId"), r.getAs[Double]("productIdInt").toInt)
}).distinct.join(productsRdd).map({
  case(productId, (productIdInt, title)) => (productIdInt, (productId, title))
}).collectAsMap()
{% endhighlight %}

We’ll choose a random user and give them some 
suggestions using our model. Before that let’s 
see what are the books the user has rated.

{% highlight scala %}
//Get random user
val userIdInt = booksRatingsRdd.takeSample(withReplacement=false, num=1)(0).user
{% endhighlight %}

_userIdInt: Int = 206424_

{% highlight scala %}
//Display user's products and ratings
val userId = usersMap.get(userIdInt).get
{% endhighlight %}

_userId: String = A2XBIAMVFZ08CE_

Print the books reviewed by the user with id _A2XBIAMVFZ08CE_.

{% highlight scala %}
println(s"Reviewed products by user $userId:")
println("Title | Rating")
booksRatingsRdd.filter(_.user == userIdInt).map(r => {
  (r.product, r.rating)
}).collect().foreach(r => {
   println(productsMap.get(r._1).get._2 + "\t" + r._2)
})
{% endhighlight %}

_Reviewed products by user A2XBIAMVFZ08CE:_<br>
_Title | Rating_<br>
_The Real All Americans: The Team That Changed a Game, a People, a Nation | 5.0_<br>
_The Great Deformation: The Corruption of Capitalism in America | 5.0_<br>
_Churchill, Hitler, and “The Unnecessary War”: How Britain Lost Its Empire and the West Lost the World | 5.0_<br>
_All American: The Rise and Fall of Jim Thorpe | 5.0_<br>
_Northwest Coast Indian Art: An Analysis of Form (Thomas Burke Memorial Washington State M) | 3.0_<br>
_Family Fortunes: How to Build Family Wealth and Hold on to It for 100 Years | 5.0_<br>
_1491: New Revelations of the Americas Before Columbus | 5.0_<br>
_Sex in history | 5.0_<br>
_Looking at Indian Art of the Northwest Coast | 3.0_<br>

Now let’s ask our model to give us recommendations 
for the user based on their preferences.

{% highlight scala %}
val topFiveRecommendations = matrixModel.recommendProducts(userIdInt, 10)
println(s"Top 10 recommendations for user $userId:")
println("Title")
topFiveRecommendations.foreach(r => {
  println(productsMap.get(r.product).get._2)
})
{% endhighlight %}

_Top 10 recommendations for user : A2XBIAMVFZ08CE_<br>
_Title_<br>
_Love’s Indecision (Warrior Camp) (Volume 2)_<br>
_Insight_<br>
_The Book of Martial Power_<br>
_Mei Mei Little Sister: Portraits from a Chinese Orphanage_<br>
_The Machine Knitter’s Handbook_<br>
_Brody’s Ghost Volume 3_<br>
_Culture Made Stupid (Cvltvre Made Stvpid)_<br>
_Amulets: Sacred Charms of Power and Protection_<br>
_Crafting Magick with Pen and Ink: Learn to Write Stories, Spells and Other Magickal Works_<br>
_Venus: The Dark Side_<br>

[sparkals]: https://spark.apache.org/docs/1.6.2/mllib-collaborative-filtering.html
[amzdata]: http://jmcauley.ucsd.edu/data/amazon
[mae]: https://en.wikipedia.org/wiki/Mean_absolute_error
[falsepositives]: https://en.wikipedia.org/wiki/False_positives_and_false_negatives
[githubcode]: https://github.com/ariasjose/AMZ_Books_Suggestions
