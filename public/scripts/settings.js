!function r(n,e,t){function o(u,f){if(!e[u]){if(!n[u]){var c="function"==typeof require&&require;if(!f&&c)return c(u,!0);if(i)return i(u,!0);throw new Error("Cannot find module '"+u+"'")}var l=e[u]={exports:{}};n[u][0].call(l.exports,function(r){var e=n[u][1][r];return o(e?e:r)},l,l.exports,r,n,e,t)}return e[u].exports}for(var i="function"==typeof require&&require,u=0;u<t.length;u++)o(t[u]);return o}({1:[function(){$(document).ready(function(){$("#links .add-item").on("click",function(r){$("#new-link-form").stop(),$("#new-link-form").slideToggle(),r.preventDefault()})})},{}]},{},[1]);