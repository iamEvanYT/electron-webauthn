# Configure Entitlements and Provisioning

For this package to work, you need to configure your entitlements and provisioning profile correctly.

## 1. App ID

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Click on "Identifiers"
3. Create a new App ID
4. If you require webauthn to be available on every website, go to "Capability Requests" and apply for "Web Browser Public Key Credential Requests"
5. If you have a specific website that you want to enable webauthn for, go to "Capabilities" and enable "Associated Domains". Then, [add the associated domain file to your website](https://developer.apple.com/documentation/xcode/supporting-associated-domains#Add-the-associated-domain-file-to-your-website).
6. Register the App ID

## 2. Provisioning Profile

You will need a provisioning profile to use these entitlements.

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Click on "Profiles"
3. Create a new Provisioning Profile
4. Choose a "Distribution" "Developer ID" profile. (which is used to distribute your app to users)
5. Then, choose your newly created App ID.
6. Download the provisioning profile.
7. Put it in `build/profile.provisionprofile`
8. Setup electron builder's config (or whatever builder you are using) to use this provisioning profile.

## 3. Entitlements

Add the following entitlements to your app:

```xml
<!-- Replace with your Team ID and Bundle ID. -->
<key>com.apple.application-identifier</key>
    <string>TEAM_ID.com.example</string>

<!-- Enable webauthn for every domain. -->
<key>com.apple.developer.web-browser.public-key-credential</key>
    <true/>

<!-- Or, enable webauthn for whitelisted domains. (Change example.com to your domain.) -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>webcredentials:example.com</string>
</array>
```
