---
title: "Working with the Search API module in Drupal 8"
description: "The Search API module provides a framework for easily creating searches on any entity known to Drupal, using any kind of search engine. For site administrators, it is a great alternative to other search solutions, since it already incorporates facetting support and the ability to use the Views module for displaying search results, filters, etc."
pubDate: "2018-12-16T05:35:07.322Z"
tags: []
---

I worked with the Search API module in Drupal 8 which helps us to configure and create our own search servers and indexes.

The Search API module provides a framework for easily creating searches on any entity known to Drupal, using any kind of search engine. For site administrators, it is a great alternative to other search solutions, since it already incorporates facetting support and the ability to use the Views module for displaying search results, filters, etc. Also, with the Apache Solr integration, a high-performance search engine is available for this module.

The Default Search Module helps with a kickstart by creating a server and an index by default. We can edit both of them or create new ones. The index can be edited and various fields can be added to the index which will help us refine our search even more. We can even style our search. We can select different Processes like Highlight the searched text, Stop words etc. Every Entity we select in Drupal is Indexed to the server and can be searched.

I used Devel module to create dummy content for my website which will be used to search.

For searching, I created a new view in which I created a block, which i placed in the breadcrumbs region of my website. The search view has different fields So that all the elements of an entity can be displayed as search results.

#### Sources:

- https://www.drupal.org/
