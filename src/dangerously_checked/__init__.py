def greet(name: str):
    return f"Hello {name}!"


def hello() -> str:
    return greet("general")
