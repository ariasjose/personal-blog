---
layout: post
title:  "Creating A Serverless API Using NET Core, AWS Lamba And AWS API Gateway"
date:   2018-08-29 18:00:00 -0600
categories: [Serverless]
tags: [API Gateway, ASP.NET, ASP.NET Core, AWS, C#, Lambda, Serverless, Web API]
---

<p class="intro"><span class="dropcap">A</span>
fter getting certified as AWS Solutions architect, 
I was really excited about the possibility of deploying 
an ASP.NET WebApi using API Gateway and AWS Lambda 
functions and get rid of the need of having an IIS 
server installed on a physical or virtual machine.
</p>

And this how I ended up writing this article where 
I’m going to show you how to deploy a basic ASP.NET 
Core WebApi on AWS, what is called a serverless API.

The first thing I’d recommend is to download and 
install the AWS Toolkit for Visual Studio which 
offers a really nice interface for connecting and 
administrating your AWS resources but here we’re 
going to use it for the project templates it provides. 
[Here][awstoolkit]{:target="_blank"}‘s a direct 
link to the VS2017 version.

In previous versions of ASP.NET had IIS as a dependency 
for running applications. As ASP.NET Core is designed 
to facilitate cross-platform support meaning that now 
we can run ASP.NET applications on Linux and Mac 
environments and, most importantly for this article 
purposes, on AWS.

Typically (by default), an ASP.NET Core 2.x application 
entry point is the Kestrel server component, which 
communicates directly to the Application. This 
implementation can be combined with a reverse proxy 
such as Nginx, IIS or even Apache for preliminary 
requests handling. None of this can be used without 
the Kestrel component.

<figure>
	<img src="{{ '/assets/img/2018/08/internet-to-kestrel.png' | prepend: site.baseurl }}" 
    alt="ASP.NET Core 2.x Application flow"> 
	<figcaption>ASP.NET Core 2.x Application flow</figcaption>
</figure>

In an AWS environment, the Kestrel component is 
replaced with the Lambda server (Amazon.Lambda.AspNetCoreServer) 
and a third component such as the API Gateway can be 
used to transfer the HTTP request directly to this server.

<figure>
	<img src="{{ '/assets/img/2018/08/aws-c.png' | prepend: site.baseurl }}" 
    alt="ASP.NET Core 2.x Application flow"> 
	<figcaption>ASP.NET Core 2.x Application flow</figcaption>
</figure>

Understanding this process we can start by creating 
our sample project from the templates the AWS Toolkit 
provides. The first thing we need to do is to select 
the “AWS Serveless Application (.NET Core)” project 
and on the next screen select the  “ASP.NET Core Web API” 
as the blueprint.

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-01.png' | prepend: site.baseurl }}" 
    alt="Project template"> 
	<figcaption>Project template</figcaption>
</figure>

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-02.png' | prepend: site.baseurl }}" 
    alt="Project Blueprint"> 
	<figcaption>Project Blueprint</figcaption>
</figure>

This automatically will create everything for you, 
and if you look closely at the NuGet packages an 
Amazon.Lambda.AspNetCoreServer dependency has been added.

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-03.png' | prepend: site.baseurl }}" 
    alt="Project structure"> 
	<figcaption>Project structure</figcaption>
</figure>

Also notice that two API controllers have been added, 
for keeping this simple we’ll focus our attention on the 
_ValuesController.cs_ class and will modify the GET 
method to return a _“This is our first API”_ message.

{% highlight scala %}
// GET api/values
[HttpGet]
public string Get()
{
    //return new string[] { "value1", "value2" };
    return "This is our first API";
}
{% endhighlight %}

Notice that in addition to the _Startup.cs_ class we 
have two classes, the _LocalEntryPoint.cs_ and 
_LambdaEntryPoint.cs_. The first one is the same as 
the traditional Program.cs class and is used for 
running the application locally using the default 
Kestrel server.

The _LambdaEntryPoint.cs_ instead, a class that derives 
from the abstract class _Amazon.Lambda.AspNetCoreServer.APIGatewayProxyFunction.cs_ 
is used in the AWS environment to provide an easy 
way to establish the communication between the API Gateway 
and the application in both ways. The function handler 
for the Lambda function will point to the method 
_FunctionHandlerAsync_ within this class.

On the AWS side, for simplicity, I have created a group 
called _VSDevelopers_ and added a user to it named 
_VisualStudio_. I have also attached the _AdministratorAccess_ 
template to this group. This is something we should not 
do for security reasons. You need to specify an Access 
Key ID and a Secret Access Key to this user.

Now let’s try to remove all the S3 functionality from the API. 
Start by removing the class _S3ProxyController.cs_ 
which exposes the S3 API.

Within the project, we have a special _serverless.template_ 
JSON file which serves as the CloudFormation template for 
our Lamba and API Gateway resources. Pay special attention 
to this file as it contains the necessary resources to 
create our Serverless API and its components. You’ll see 
settings like the timeout for the execution of the function 
and the maximum memory usage. Bear in mind that the policy 
_“AWSLambdaFullAccess”_ can lead to security breaches and 
you need to create one according to your needs. Also, notice 
the “/{proxy+}” value for the Path setting, meaning that 
every request is going to be sent to this lambda function, 
you might want to change that as well.

Again, for simplicity, I’ve removed the sections 
associated with S3 from this template.

{% highlight json %}
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Transform" : "AWS::Serverless-2016-10-31",
  "Description" : "An AWS Serverless Application that uses the ASP.NET Core framework running in Amazon Lambda.",
   
  "Resources" : {
 
    "AspNetCoreFunction" : {
      "Type" : "AWS::Serverless::Function",
      "Properties": {
        "Handler": "AWSServerless1::AWSServerless1.LambdaEntryPoint::FunctionHandlerAsync",
        "Runtime": "dotnetcore2.0",
        "CodeUri": "",
        "MemorySize": 256,
        "Timeout": 30,
        "Role": null,
        "Policies": [ "AWSLambdaFullAccess" ],
        "Environment" : {
          
        },
        "Events": {
          "PutResource": {
            "Type": "Api",
            "Properties": {
              "Path": "/{proxy+}",
              "Method": "Get"
            }
          }
        }
      }
    }
  },
 
  "Outputs" : {
    "ApiURL" : {
        "Description" : "API endpoint URL for Prod environment",
        "Value" : { "Fn::Sub" : "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/" }
    }
  }
}
{% endhighlight %}

After modifying those files, let’s build the solution, 
right click on the project file and select the 
“Publish to AWS Lambda…” option. A screen with some 
additional settings will prompt you to enter a 
configuration profile, a Stack name (for CloudFormation) 
and an S3 bucket for storing the stack template and 
the project files temporarily. If you haven’t set up 
your AWS profile in the AWS Toolkit before, this is 
where you’ll need your credential granted to the user 
previously created.

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-04.png' | prepend: site.baseurl }}" 
    alt="Publish to AWS Lambda screen"> 
	<figcaption>Publish to AWS Lambda screen</figcaption>
</figure>

Click on the Publish button and a screen 
with the deploy details will appear.

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-06.png' | prepend: site.baseurl }}" 
    alt="Stack creation details"> 
	<figcaption>Stack creation details</figcaption>
</figure>

Copy the URL shown as the API endpoint and add 
the API path to it (api/Values in our case), 
then paste it into your browser. 
You should receive a response.

<figure>
	<img src="{{ '/assets/img/2018/08/vs-aws-07.png' | prepend: site.baseurl }}" 
    alt="API response"> 
	<figcaption>API response</figcaption>
</figure>

The solution files used in this post can be found 
[here][githubcode]{:target="_blank"}.

[awstoolkit]: https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.AWSToolkitforVisualStudio2017
[githubcode]: https://github.com/ariasjose/AMZ_Books_Suggestions
