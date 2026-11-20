---
title: "Creating a slider using Views Slideshow - Drupal 8"
description: "The Views Slideshow module helps us create a slideshow for our Drupal website/blog. The slideshow can consist of not just images but texts, comments etc."
pubDate: "2018-12-20T05:35:07.322Z"
tags: []
---

The Views Slideshow module helps us create a slideshow for our Drupal website/blog. The slideshow can consist of not just images but texts, comments etc. It is assisted with external Jquery plugins for transition effects, slideshow settings and transition time.

I worked with the Views slideshow module in drupal 8 to create a slider for my blog. It is very easy to use and provides a lot of variations for multiple features for our slider.

We can either create a new content type with an image field or pick the article content type. A custom view is created to display our images in the content type we choose. The display type is selected as slideshow of fields. Setting a filter criteria of images from our content type and adding the image field to our view. The slider can be configured with various options like transition time, animation, applying widgets, pause/play on hover etc.

![screen](/assets/blog/img/Screenshot%20%2824%29.png)

Also, the slider requires a plugin, Jquery Cycle. It is to be copied in the Drupal root directory under libraries/jquery.cycle directory. This plugin is required for the implementation of the slider function. Also, it provides the user with various transition effects such as slide, shuffle, cover, zoom etc.

![plugin](/assets/blog/img/Screenshot%20%2825%29.png)

After this, the block created via views is placed. Also, the cache is to be flushed to refresh the javascript files.

The Views Slideshow module is the easiest way to get a stunning slider on a website. I loved using this awesome module. Testing different features and transition effects made the experience more fun. We can even use various other jquery plugins for the widgets, effects and other functions. This module not only provides the website with a stunning slideshow but also the animations associated with it.
