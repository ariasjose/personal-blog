---
layout: post
title:  "How To Install Spark 1.6.2 On A Windows 10 (x64) Machine"
date:   2018-04-02 18:00:00 -0600
categories: [Uncategorized]
tags: [Hadoop, Scala, Spark, Windows]
---

I have spent some time trying to find a complete 
guide for installing Spark in a windows environment 
without any success. I followed some steps but even 
after complete some tutorials still had some issues. 
On this post, I’ll show you some simple steps for 
having Spark 1.6.2 running on your Windows 10 machine.

### Pre-Requisites
* Java 1.7+ installed.
* JAVA_HOME system variable properly set.

### Download Scala
For purpose of this guide, we’ll download Scala 2.10.7 
as this version has been proved to work well with Spark 1.6.2. 
You can download it from [here][scala]{:target="_blank"}. 
Then execute the installer.

### Download Spark 1.6.2 Binaries
Next step is download Spark binaries. 
Tar package can be downloaded from 
[here][spark]{:target="_blank"}.
After downloading the package, extract 
the content in a folder created for 
the same. In my case, I chose _C:\spark\spark-1.6.2-bin-hadoop2.6_. 
Make sure this path contains the bin folder.

![image1](/assets/2018/04/1.png)

### Download Winutils Package
So here’s the tricky part. Turns out that there 
are 2 different versions of winutils, one for 
x32 systems and one for x64 systems. As I have 
a 64bits machine I’ve downloaded the x62 version. 
There’s no compatibility between them but for x32 
systems there’s a winutils executable for Hadoop 3.x. 
only. I haven’t tried that version yet but seeing 
other posts looks like it might work.

### Download Winutils Package
So here’s the tricky part. Turns out that there are 
2 different versions of winutils, one for x32 systems 
and one for x64 systems. As I have a 64bits machine 
I’ve downloaded the x62 version. There’s no compatibility 
between them but for x32 systems there’s a winutils 
executable for Hadoop 3.x. only. I haven’t tried that 
version yet but seeing other posts looks like it might work.

So let’s move on and download the winutils package 
from [here][winutils]{:target="_blank"}. 
As we downloaded a Spark 1.6.2 pre-built for Apache 
Hadoop 2.6, we need to extract winutils package and 
only the Hadoop 2.6.0 folder (other 2.6.x may work 
fine as well) will be necessary. Put the content in 
a folder created for the same, I chose 
_C:\spark\winutils-master\hadoop-2.6.0_. 
Make sure this path contains the bin folder 
where _winutils.exe_ is present.

![image2](/assets/2018/04/2.png)

### Set Environment Variables
After downloading and installing necessary 
binaries/packages you’ll need to set a few 
system environment variables.

* SCALA_HOME: Will be your Scala directory. 
Usually _C:\Program Files (x86)\scala_.
* SPARK_HOME: Will be your Spark directory. 
In my case _C:\spark\spark-1.6.2-bin-hadoop2.6_.
* HADOOP_HOME: Will be your winutils directory. 
In my case _C:\spark\winutils-master\hadoop-2.6.0_.

After setting up the environment variables you should 
add the corresponding _&#42;&#42;&#42;&#95;HOME\bin_ directories 
(for every variable created) to your system path 
variable so you can run commands from the CMD or 
PS console. You can do this appending below line 
to your path variable value: 
_%SCALA_HOME%\bin;%SPARK_HOME%\bin;%HADOOP_HOME%\bin_.

### Test Your Installation
Now that we have everything set up, let’s open a 
CMD or PS window as Administrator and run _spark-shell_ command. 
You should be able to use Spark on your Windows machine now.

### A Few Considerations
After running Spark for the first time, the directory 
_C:\tmp\hive_ will be created. It is important to run 
Spark as Administrator to avoid permission issues with 
this folder. If you are having issues with SQL context 
or the permissions of this folder you can delete it and 
create it manually. Then explicitly set the permissions 
of this folder and make it public running this command 
from command line: _winutils chmod -R 777 \tmp\hive_.

Also, you’ll notice that after closing Spark session 
with _:quit_ command there’s a _ShutdownHookManager_ 
related error. What it means is that the temporary 
directory created for the session cannot be deleted 
from the AppData folder. This is something that’s been 
reported several times but seems like Windows related 
defects have low priority for the Spark team 
(totally understood). Nothing you can live without.


[scala]: https://downloads.lightbend.com/scala/2.10.7/scala.msi
[spark]: https://archive.apache.org/dist/spark/spark-1.6.2/spark-1.6.2-bin-hadoop2.6.tgz
[winutils]: https://github.com/steveloughran/winutils
