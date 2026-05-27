deployment_states = {}

def set_state(deployment_id, data):
    deployment_states[deployment_id] = data

def get_state(deployment_id):
    return deployment_states.get(deployment_id)

def update_state(deployment_id, updates):

    if deployment_id in deployment_states:
        deployment_states[deployment_id].update(updates)

def remove_state(deployment_id):

    deployment_states.pop(
        deployment_id,
        None
    )