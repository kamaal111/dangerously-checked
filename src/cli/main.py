from typer import Typer

from cli.validate_param_type_set import (
    validate_param_type_set as validate_param_type_set_action,
)

app = Typer()


@app.command()
def hello(name: str):
    print(f"Hello {name}")


@app.command()
def validate_param_type_set(filepath: str):
    validate_param_type_set_action(filepath)


if __name__ == "__main__":
    app()
