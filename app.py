import xml.etree.ElementTree as ET
import requests
import time
from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_DURATION = 300  # 5 minutes cache
_cache = {
    "data": None,
    "last_fetched": 0
}

def fetch_and_parse_feed(force_refresh=False):
    current_time = time.time()
    if not force_refresh and _cache["data"] and (current_time - _cache["last_fetched"] < CACHE_DURATION):
        return _cache["data"]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse Atom XML feed
        # Atom standard namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(response.content)
        
        # Feed metadata
        feed_title_node = root.find('atom:title', ns)
        feed_title = feed_title_node.text if feed_title_node is not None else "BigQuery Release Notes"
        
        feed_updated_node = root.find('atom:updated', ns)
        feed_updated = feed_updated_node.text if feed_updated_node is not None else ""
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title_node = entry.find('atom:title', ns)
            title = title_node.text if title_node is not None else ""
            
            updated_node = entry.find('atom:updated', ns)
            updated = updated_node.text if updated_node is not None else ""
            
            id_node = entry.find('atom:id', ns)
            entry_id = id_node.text if id_node is not None else ""
            
            link_node = entry.find('atom:link', ns)
            link = link_node.attrib.get('href', '') if link_node is not None else ""
            
            content_node = entry.find('atom:content', ns)
            content = content_node.text if content_node is not None else ""
            
            entries.append({
                "title": title,
                "updated": updated,
                "id": entry_id,
                "link": link,
                "content": content
            })
            
        result = {
            "title": feed_title,
            "updated": feed_updated,
            "entries": entries,
            "cached_at": current_time,
            "status": "success"
        }
        
        _cache["data"] = result
        _cache["last_fetched"] = current_time
        return result

    except Exception as e:
        # If there's an error and we have cached data, return it with a warning
        if _cache["data"]:
            stale_data = _cache["data"].copy()
            stale_data["status"] = "stale"
            stale_data["error"] = str(e)
            return stale_data
        
        return {
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}",
            "entries": []
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    data = fetch_and_parse_feed(force_refresh=force_refresh)
    
    if data.get("status") == "error":
        return jsonify(data), 502
        
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
