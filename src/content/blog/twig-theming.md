---
title: "Converting a new website to Drupal 8 theme using twig commands"
description: "Twig is a great tool with which we can integrate any HTML5 and CSS website to a drupal8 theme easily. I worked on a new website made with HTML5 and CSS, containing 4 regions: The navbar, home section, main content and a footer."
pubDate: "2018-11-19T05:35:07.322Z"
tags: []
---

Twig is a great tool with which we can integrate any HTML5 and CSS website to a drupal8 theme easily. I worked on a new website made with HTML5 and CSS, containing 4 regions: The navbar, home section, main content and a footer. To convert this to a drupal8 theme the following steps were taken:

- The website was created and the folder was copied to the themes directory of my drupal site.
- The index.html file was renamed to page.html.twig to make it compatible for twig.
- Two new files namely mytheme.libraries.yml and mytheme.info.yml were created.
- The file mytheme.info.yml contains the information about our theme like the name, drupal core version, the different regions etc.
- The file mytheme.libraries.yml contains the attachment of our css file as a theme.
- The different regions were marked in the page.html.twig file.
- The last step was to run our dupal site and install and set our new theme as default.
- Also, the blocks had to be disabled as they did not match with our theme.

### mytheme.info.yml

This file provides a meta-data about our theme to Drupal. The modules and installation profiles are defined in the same way. All the information our theme has to provide to drupal goes in this file.

- Name: Defines the name of our theme.
- Description: A short description of our theme.
- Package: This is where our theme is placed.
- Type: Lets Drupal know that this file is a theme info file.
- Version: The version of our theme.
- Core: Drupal core version the theme requires.

### mytheme.libraries.yml

This file provides the linked CSS files to Drupal. All the styling and scripting files associated with our website are defined using libraries in this file.

- First goes the name. eg: Style:
- Then goes the base category. eg: css:
- Then the theme category.
- Under theme we added our css file.

Using Drupal we understand that flexibility is a key element in creating websites. With Twig we can use our own themes, modify them the way we want and place a block by defining our own region. I myself love the implementation of twig in Drupal. Choosing, using or even creating the perfect theme for our website could not get any easier.

#### Sources:

- https://www.youtube.com/watch?v=xdifbN3y5hU&t=691s
- https://www.drupal.org/docs/8/theming-drupal-8/defining-a-theme-with-an-infoyml-file
