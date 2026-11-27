Qestas Android APK build

1. Upload the contents of this project folder to a GitHub repository (not the outer folder).
2. Make sure the default branch is main or master.
3. Open the repository Actions tab.
4. Select "Build Qestas Android APK" and click "Run workflow" (or push a commit).
5. When the workflow finishes successfully, open the run and download the "Qestas-debug-APK" artifact.

The APK uses application ID ir.qestas.app and app name Qestas.
The app's existing API URL https://demo.qestas.ir/api has been left unchanged.
This workflow creates a debug APK for testing, not a Play Store release APK.
Backend endpoints, HTTPS/CORS behavior, authentication, and Supabase-dependent screens still need runtime testing.
