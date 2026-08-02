import docker
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to connect to Docker daemon
try:
    client = docker.from_env()
    DOCKER_AVAILABLE = True
except docker.errors.DockerException:
    DOCKER_AVAILABLE = False
    logger.warning("Docker Engine not found. Cyber Range instances will be simulated.")

ACTIVE_CONTAINERS = {}

def spawn_target(lobby_id, scenario="sqli_login"):
    """
    Spawns a vulnerable Docker container based on the scenario.
    Returns the target IP or simulated IP.
    """
    if not DOCKER_AVAILABLE:
        # Fallback for cloud/Render deployment
        return {"success": True, "ip": f"10.13.37.{hash(lobby_id) % 254}", "simulated": True}

    try:
        # Map scenarios to Docker images (requires pre-pulled or public images)
        images = {
            "sqli_login": "bkimminich/juice-shop", # Using OWASP Juice Shop as a proxy for vulnerable web apps
            "web_breach": "vulnerables/web-dvwa",
            "ransomware": "vulnerables/cve-2014-6271" # Shellshock vulnerable target
        }
        
        image_name = images.get(scenario, "bkimminich/juice-shop")
        container_name = f"target_{lobby_id}_{int(time.time())}"
        
        # Run container in background, detached, mapping to a random host port
        container = client.containers.run(
            image_name,
            name=container_name,
            detach=True,
            ports={'80/tcp': None, '3000/tcp': None},
            network_mode="bridge"
        )
        
        # Reload container to get allocated ports
        container.reload()
        
        ACTIVE_CONTAINERS[lobby_id] = container.id
        
        return {"success": True, "container_id": container.id, "simulated": False}

    except Exception as e:
        logger.error(f"Failed to spawn target for {lobby_id}: {str(e)}")
        return {"success": False, "error": str(e), "simulated": True}


def teardown_target(lobby_id):
    """
    Stops and removes the vulnerable Docker container for a given lobby.
    """
    if not DOCKER_AVAILABLE or lobby_id not in ACTIVE_CONTAINERS:
        return {"success": True, "simulated": True}

    container_id = ACTIVE_CONTAINERS[lobby_id]
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=5)
        container.remove()
        del ACTIVE_CONTAINERS[lobby_id]
        return {"success": True, "simulated": False}
    except Exception as e:
        logger.error(f"Failed to teardown target {lobby_id}: {str(e)}")
        return {"success": False, "error": str(e)}
