---
layout: post
title:  "Random numbers list within a range"
date:   2017-12-14 17:17:00 -0600
categories: general
---
One group of students asked me if there is a simple way to generate random numbers with no duplicates.

As this is a fundamentals course, I couldn't show them a solution using lists or something more useful by expert programmers, but I guess this is little piece of code saved their day.

{% highlight java %}
//Returns an array of random numbers between min and max with length totalRandom
public int[] getRandomSequence(int totalRandom, int min, int max) {
  
  //throws exception if arguments are invalid
  if (min > max || max - min + 1 < totalRandom) {
    throw new IllegalArgumentException("invalid arguments");
  }

  //Creates an array with the numbers in range
  int[] numbersInRange = new int[max - min + 1];

  int index = 0;
  for (int i = min; i <= max; i++) { 
    numbersInRange[index++] = i; 
  } 
   
  //Creates the array of random numbers 
  int[] randomNumbers = new int[totalRandom];
  
  //finds the numbers 
  Random rand = new Random(); 
  int totalNumbers = 0;
  index = max - min; 
  int randomIndex; 
  int temp; 

  while (index >= 0 && totalNumbers < totalRandom) {
    randomIndex = index != 0 ? rand.nextInt(index) : 0;
    randomNumbers[totalNumbers] = numbersInRange[randomIndex];
    totalNumbers++;
    
    //swap
    temp = numbersInRange[randomIndex];
    numbersInRange[randomIndex] = numbersInRange[index];
    numbersInRange[index] = temp;
    index--;
  }

  return randomNumbers;
}
{% endhighlight %}