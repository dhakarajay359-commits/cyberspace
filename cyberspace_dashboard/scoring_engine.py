import time
import threading
import logging
import requests

logger = logging.getLogger(__name__)

# This will hold a reference to the active games dictionary from app.py
_active_games = None
_socketio = None

def init_scoring_engine(active_games_ref, socketio_ref):
    global _active_games, _socketio
    _active_games = active_games_ref
    _socketio = socketio_ref
    
    # Start the background scoring loop
    threading.Thread(target=scoring_loop, daemon=True).start()
    logger.info("Scoring Engine initialized and background thread started.")

def scoring_loop():
    """
    Background loop that continuously monitors active games and adjusts points.
    - Blue Team earns points over time if the target is healthy.
    - Red Team earns points by submitting valid flags.
    """
    while True:
        try:
            for lobby_id, game in list(_active_games.items()):
                if game.get('status') == 'active':
                    # Ensure scoring structures exist
                    if 'scores' not in game:
                        game['scores'] = {'red': 0, 'blue': 0}
                    
                    # Blue team gets 1 point every tick (5s) if health > 50
                    if game.get('health', 100) > 50:
                        game['scores']['blue'] += 1
                        
                    # Ping target IP if available (Health Check Simulation)
                    target_ip = game.get('target_ip')
                    if target_ip and target_ip != 'N/A':
                        # Example: in a real environment, we would HTTP GET the target
                        # For simulation, if target is "packed", it's healthy
                        if game.get('target_state') == 'packed':
                            pass # healthy
                        else:
                            game['health'] = max(0, game['health'] - 5)
                            
                    # Emit updated score
                    _socketio.emit('live_event_update', {'type': 'score_update', 'scores': game['scores']}, room=lobby_id)
                    
        except Exception as e:
            logger.error(f"Error in scoring loop: {str(e)}")
            
        time.sleep(5) # Tick every 5 seconds

def submit_flag(lobby_id, team, flag):
    """
    Validates a submitted flag and awards points to the Red team.
    """
    if not _active_games or lobby_id not in _active_games:
        return {"success": False, "error": "Game not active"}
        
    game = _active_games[lobby_id]
    
    # Check if flag matches (Hardcoded for now, could be dynamic per scenario)
    VALID_FLAGS = ['FLAG{SQLi_pwned}', 'FLAG{RCE_success}', 'FLAG{root_access}']
    
    if flag in VALID_FLAGS:
        if 'scores' not in game:
            game['scores'] = {'red': 0, 'blue': 0}
            
        game['scores']['red'] += 100
        game['logs'].append(f"<span class='text-red-400 font-bold'>[FLAG] {team.upper()} Team captured a flag! (+100 Points)</span>")
        
        _socketio.emit('live_event_update', {'type': 'score_update', 'scores': game['scores']}, room=lobby_id)
        return {"success": True, "message": "Flag accepted!"}
    
    return {"success": False, "error": "Invalid Flag"}
