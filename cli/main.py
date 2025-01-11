from typer import Typer

app = Typer()


@app.command()
def hello(name: str):
    print(f"Hello {name}")


@app.command()
def validate_param_type_set(name: str):
    print(f"Hello {name}")


if __name__ == "__main__":
    app()
