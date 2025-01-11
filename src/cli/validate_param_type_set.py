import json
from pathlib import Path
from typing import Callable, TypeVar

import tree_sitter_python as tspython
from pydantic import BaseModel
from tree_sitter import Language, Node, Parser, Tree

PY_LANGUAGE = Language(tspython.language())

parser = Parser(PY_LANGUAGE)


class ValidatedParameter(BaseModel):
    name: str
    type_hint: str | None


class ValidatedFunction(BaseModel):
    function_name: str
    parameters: list[ValidatedParameter]


FindTypeVar = TypeVar("FindTypeVar")


def find(
    items: list[FindTypeVar], predicate: Callable[[FindTypeVar], bool]
) -> FindTypeVar | None:
    for item in items:
        if predicate(item):
            return item

    return None


def __get_function_parameters(node: Node, source_code: str) -> list[ValidatedParameter]:
    if node.type != "parameters":
        for child in node.children:
            result = __get_function_parameters(child, source_code)
            if result is not None:
                return result

    params: list[ValidatedParameter] = []
    for child in node.children:
        if child.type == "typed_parameter" or child.type == "typed_default_parameter":
            identifier = find(child.children, lambda c: c.type == "identifier")
            if identifier is None:
                continue

            type_node = find(child.children, lambda c: c.type == "type")
            param_name = source_code[identifier.start_byte : identifier.end_byte]
            param_type = (
                source_code[type_node.start_byte : type_node.end_byte]
                if type_node
                else None
            )
            params.append(ValidatedParameter(name=param_name, type_hint=param_type))
        elif child.type == "identifier":
            param_name = source_code[child.start_byte : child.end_byte]
            params.append(ValidatedParameter(name=param_name, type_hint=None))

    return params


def __extract_functions_with_params(
    tree: Tree, source_code: str
) -> list[ValidatedFunction]:
    functions: list[ValidatedFunction] = []
    root_node = tree.root_node
    for node in root_node.children:
        if node.type != "function_definition":
            continue

        func_node = find(node.children, lambda c: c.type == "identifier")
        if func_node is None:
            raise Exception("Function does not have an identifier")

        func_name = source_code[func_node.start_byte : func_node.end_byte]
        params_node = find(node.children, lambda c: c.type == "parameters")
        params = (
            __get_function_parameters(params_node, source_code) if params_node else []
        )
        functions.append(ValidatedFunction(function_name=func_name, parameters=params))

    return functions


def validate_param_type_set(filepath: str):
    file = Path(filepath)
    code = file.read_text()
    tree = parser.parse(code.encode())
    functions = __extract_functions_with_params(tree, code)

    print(
        json.dumps(list(map(lambda object: object.model_dump(mode="json"), functions)))
    )
