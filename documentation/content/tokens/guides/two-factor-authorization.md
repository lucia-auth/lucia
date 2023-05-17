---
title: "Two-factor authentication"
description: "Things to consider before implementing two-factor authentication"
---

Two-factor authentication (2FA) is a great way to introduce an extra layer of security to your application. Both One-time passwords and magic links type 2FA can be implemented using [id tokens](/tokens/basics/id-tokens) and [password tokens](/tokens/basics/password-tokens).

However, there are some things to consider before implementing it.

#### 1. One time passwords may be susceptible to social engineering

Social engineering is a tactic used to get access to important credentials, not by hacking into the device, but by tricking the user into giving the info. Phishing is one common social engineering technique.

#### 2. SMS is unencrypted

SMS verification is the only way to verify phone numbers. However, when considering it for 2FA, where a user could receive passwords multiple times a day, remember that SMS is not encrypted. Modern emails are generally encrypted in transit, though they're mostly stored unencrypted in the device.
