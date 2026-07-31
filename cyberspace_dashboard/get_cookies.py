import os
import yt_dlp
import time

print("Attempting to automatically extract YouTube cookies...")
time.sleep(1)

browsers = ['edge', 'chrome', 'firefox', 'opera', 'brave']
success = False

for browser in browsers:
    print(f"\nTrying to get cookies from {browser.capitalize()}...")
    try:
        ydl_opts = {
            'cookiesfrombrowser': (browser,),
            'cookiefile': 'cookies.txt',
            'quiet': True,
            'extract_flat': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We just ping youtube to force the cookie extraction
            ydl.extract_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ', download=False)
            
        if os.path.exists('cookies.txt'):
            print(f"\nSUCCESS! Cookies successfully extracted from {browser.capitalize()}!")
            success = True
            break
            
    except Exception as e:
        print(f"Could not get cookies from {browser.capitalize()}.")

if success:
    print("\nYou can now upload cookies.txt to GitHub!")
else:
    print("\n\nFailed to create cookies.txt")
    print("This means ALL your browsers were either completely closed or locked.")
    print("To fix this, please open Microsoft Edge, log into YouTube.com, and run this script again!")

input("\nPress ENTER to exit...")
