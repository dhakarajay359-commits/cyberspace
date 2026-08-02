import yt_dlp

def get_yt_dlp_options():
    opts = {
        'quiet': True,
        'no_warnings': True,
        'format': 'bestvideo+bestaudio/best',
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'web']
            }
        }
    }
    return opts

def internal_youtube_search(query, max_results=10):
    try:
        ydl_opts = get_yt_dlp_options()
        ydl_opts['extract_flat'] = True
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'ytsearch{max_results}:{query}', download=False)
            results = []
            for entry in info.get('entries', []):
                results.append({'id': entry.get('id'), 'title': entry.get('title')})
            return results
    except Exception as e:
        print("Search Error:", e)
        return []

print(internal_youtube_search('cybersecurity', 3))
