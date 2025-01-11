from pathlib import Path

import tree_sitter_python as tspython
from tree_sitter import Language, Node, Parser, Tree

PY_LANGUAGE = Language(tspython.language())

parser = Parser(PY_LANGUAGE)


def __get_function_parameters(node: Node, source_code: str):
    if node.type != "parameters":
        for child in node.children:
            result = __get_function_parameters(child, source_code)
            if result is not None:
                return result

    params = []
    for child in node.children:
        if child.type == "typed_parameter" or child.type == "typed_default_parameter":
            identifier = next(
                (c for c in child.children if c.type == "identifier"), None
            )
            if identifier is None:
                continue

            type_node = next((c for c in child.children if c.type == "type"), None)
            param_name = source_code[identifier.start_byte : identifier.end_byte]
            param_type = (
                source_code[type_node.start_byte : type_node.end_byte]
                if type_node
                else None
            )
            params.append({"name": param_name, "type_hint": param_type})
        elif child.type == "identifier":
            param_name = source_code[child.start_byte : child.end_byte]
            params.append({"name": param_name, "type_hint": None})

    return params


def __extract_functions_with_params(tree: Tree, source_code: str):
    functions = []
    root_node = tree.root_node
    for node in root_node.children:
        if node.type == "function_definition":
            func_node = next((c for c in node.children if c.type == "identifier"), None)
            func_name: str | None = None
            if func_node is not None:
                func_name = source_code[func_node.start_byte : func_node.end_byte]
            params_node = next(
                (c for c in node.children if c.type == "parameters"), None
            )
            params = (
                __get_function_parameters(params_node, source_code)
                if params_node
                else []
            )
            functions.append({"function_name": func_name, "parameters": params})

    return functions


def validate_param_type_set(filepath: str):
    file = Path(filepath)
    code = file.read_text()
    tree = parser.parse(code.encode())
    functions = __extract_functions_with_params(tree, code)
    for function in functions:
        print(f"Function: {function['function_name']}")
        for param in function["parameters"]:
            print(f"  - {param['name']}: {param['type_hint']}")
