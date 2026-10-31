# Government Sahayak - Mobile Release & Signing Guide

This guide describes the configuration and verification procedures to produce signed production release Android App Bundles (AAB) and APKs for Google Play Store deployment.

---

## 1. Keystore Generation & Security

Generate an Android production upload keystore (never commit this file to version control):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore sahayak-release-key.keystore -alias sahayak-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Gradle Release Configuration (`mobile/android/app/build.gradle`)
```groovy
signingConfigs {
    release {
        if (project.hasProperty('SAHAYAK_RELEASE_STORE_FILE')) {
            storeFile file(SAHAYAK_RELEASE_STORE_FILE)
            storePassword SAHAYAK_RELEASE_STORE_PASSWORD
            keyAlias SAHAYAK_RELEASE_KEY_ALIAS
            keyPassword SAHAYAK_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

---

## 2. Generating Release Builds

### 2.1 Generating Signed Android App Bundle (AAB for Google Play Store)
```bash
cd mobile/android
./gradlew bundleRelease
```
The output file is located at:
`mobile/android/app/build/outputs/bundle/release/app-release.aab`

### 2.2 Generating Standalone Signed APK (Direct Testing on Physical Devices)
```bash
cd mobile/android
./gradlew assembleRelease
```
The output file is located at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 3. Pre-Release Verification Checklist
- [x] Bundle size < 40 MB (current target ~18 MB with ProGuard and compressed assets).
- [x] No API keys or plain-text secrets hard-coded in bundle (verified with audit script).
- [x] `allowBackup="false"` in `AndroidManifest.xml`.
- [x] R8 / ProGuard minification enabled.
- [x] High contrast >= 7:1 for all text in light and dark modes.
- [x] 200% font scaling tested without text clipping.
- [x] Offline eligibility engine tests passing 100%.
