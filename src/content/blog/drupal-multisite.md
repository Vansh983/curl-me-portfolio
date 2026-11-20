---
title: "Setting up 2 websites using Drupal's Multisite feature"
description: "The Multisite feature enables us to create multiple websites using the same root directory or the same code base. These websites are linked to one drupal folder containing the files and folders of all the websites we create. Due to this all the websites we create get linked with each other while having different structures and different content."
pubDate: "2018-11-18T05:35:07.322Z"
tags: []
---

I worked with Drupal's Multisite feature to create two completely different websites, one having information about the [wonders of the world](wonders.vanshsood.com) and the other having information on [football clubs](footballclub.vanshsood.com).

The Multisite feature enables us to create multiple websites using the same root directory or the same code base. These websites are linked to one drupal folder containing the files and folders of all the websites we create. Due to this all the websites we create get linked with each other while having different structures and different content. For example, if we install a module in one of the websites, we could enable it in another linked website as the module folder will be created in the drupal folder both the websites are linked to. The websites we create are different because they have different databases while having a common code base.

### The Websites:

- #### Wonders of the World

  This website contains information regarding the wonders of the world, Taj Mahal, The Great Wall of China etc. This website uses the bootstrap business theme, has a simple and flat design and contains features like scroll to top. It has seven content nodes, each for a wonder, a home page and a view containing the nodes.

![won](/assets/blog/img/Screenshot%20%282%29.png)

- #### Football Clubs

  This website contains information regarding the different European football clubs, F.C. Barcelona, Real Madrid F.C. etc. This site uses a different database than wonders.vanshsood.com so it contains different nodes. This website uses the Nexus theme, has a beautiful red design and contains features like a slideshow. It has five content nodes, each for a football club, a home page and a view containing the nodes.

![fc](/assets/blog/img/Screenshot%20%283%29.png)

### Steps:

1.  Create subdomains for the websites you want to create. Example; footballclub, wonders.
2.  Create two different MySQL servers for these two subdomains and assign them two different users.
3.  Upload the drupal core installation zipped file onto your along with the subdomain folders and extract it to a folder and rename it. Example: Drupal.
4.  Create two new folders namely, footballclub and wonders in *drupal/sites/.*  Now copy files default.services.yml and default.settings.php from *drupal/sites/default*  to *drupal/sites/wonders*  and  drupal/sites/footballclub  as services.yml and settings.php respectively.
5.  Then create a sites.php file in  *drupal/sites/*  and create an array in this file containing both the subdomains and their respective folders.![arr](/assets/blog/img/Screenshot_2.png)
6.  Now we need to link the drupal folder to the two subdomain folders. To do that we first need to delete the subdomain folders so that the drupal folder links its files directly in the subdomain folders. Then we need to link them by using the *ln -s drupal_root folder*  command in the terminal![com](/assets/blog/img/Screenshot_3.png)
7.  Install drupal in both of the subdomains using the servers created in Step 2.

### I got to learn this amazing feature from the following:

- Setting up the sites directory: [https://www.drupal.org/node/53705](https://www.drupal.org/node/53705)
- Which files are to be copied and where: [https://www.drupal.org/docs/7/multisite/multi-site-sharing-the-same-code-base](https://www.drupal.org/docs/7/multisite/multi-site-sharing-the-same-code-base)
- Setting up the sites.php file: [https://drupal.stackexchange.com/questions/36328/multiple-drupal-sites-using-the-same-code-base](https://drupal.stackexchange.com/questions/36328/multiple-drupal-sites-using-the-same-code-base)

### My Experience

The Multisite feature in Drupal 8 is really amazing and helpful. With the help of this feature I can create multiple websites, using less space on my server, saving time by not having to install same modues and themes again and again in the websites nor do i have to upload libraries again in the directories.

![flow](/assets/blog/img/multisite_flow.png)

### Sources:

- [https://www.drupal.org/docs/8/multisite](https://www.youtube.com/redirect?q=https%3A%2F%2Fwww.drupal.org%2Fdocs%2F8%2Fmultisite&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)
- [http://drupal.stackexchange.com/quest...](https://www.youtube.com/redirect?q=http%3A%2F%2Fdrupal.stackexchange.com%2Fquestions%2F36328%2Fmultiple-drupal-sites-us&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)
- [https://www.drupal.org/node/53705](https://www.youtube.com/redirect?q=https%3A%2F%2Fwww.drupal.org%2Fnode%2F53705&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)
- [https://www.drupal.org/docs/7/multisi...](https://www.youtube.com/redirect?q=https%3A%2F%2Fwww.drupal.org%2Fdocs%2F7%2Fmultisite%2Fmulti-site-sharing-the-same-code-base&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)
- [https://www.wikipedia.org/](https://www.youtube.com/redirect?q=https%3A%2F%2Fwww.wikipedia.org%2F&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)
- [https://images.google.com/](https://www.youtube.com/redirect?q=https%3A%2F%2Fimages.google.com%2F&redir_token=OxAqhtdm7I0qxDuDnigUwIn2R5d8MTU0Mzc3MjQ0M0AxNTQzNjg2MDQz&v=7-e9puaIDBU&event=video_description)

### Here is the video:

[Youtube](http://www.youtube.com/watch?v=7-e9puaIDBU&t)
