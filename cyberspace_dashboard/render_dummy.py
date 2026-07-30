from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('templates'))
template = env.get_template('compete.html')

class DummyUser:
    name = "Test"
    username = "test"
    role = "student"
    is_authenticated = True

try:
    rendered = template.render(
        current_user=DummyUser(),
        config={},
        session={},
        active_games={},
        request=type('DummyRequest', (), {'application': type('App', (), {'__globals__': {'__builtins__': {'__import__': __import__}}})()})()
    )
    with open('rendered_dummy.html', 'w', encoding='utf-8') as f:
        f.write(rendered)
    print("Rendered successfully! Length:", len(rendered))
except Exception as e:
    print("Jinja Render Error:", e)
