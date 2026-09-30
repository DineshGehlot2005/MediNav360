"""
Manual implementation of Dijkstra's shortest-path algorithm for hospital
indoor navigation. Distances are fictional/demo values, not a real map.
"""

def shortest_path(graph: dict, source: str, destination: str, mode: str = "normal"):
    """
    graph: {node: {neighbor: {"distance": int, "stairs": bool,
                               "wheelchair_accessible": bool, "elevator": bool}}}
    mode: "normal" | "wheelchair" | "avoid_stairs"
    Returns {"distance": int, "path": [node, ...]} or None if unreachable.
    """
    if source not in graph or destination not in graph:
        return None

    def edge_allowed(edge):
        if mode == "wheelchair":
            return edge.get("wheelchair_accessible", True)
        if mode == "avoid_stairs":
            return not edge.get("stairs", False)
        return True

    dist = {node: float("inf") for node in graph}
    prev = {}
    visited = set()
    dist[source] = 0

    while len(visited) < len(graph):
        current, best = None, float("inf")
        for node, d in dist.items():
            if node not in visited and d < best:
                current, best = node, d
        if current is None:
            break
        visited.add(current)
        if current == destination:
            break
        for neighbor, edge in graph[current].items():
            if not edge_allowed(edge):
                continue
            alt = dist[current] + edge["distance"]
            if alt < dist[neighbor]:
                dist[neighbor] = alt
                prev[neighbor] = current

    if dist[destination] == float("inf"):
        return None

    path = [destination]
    node = destination
    while node in prev:
        node = prev[node]
        path.insert(0, node)

    return {"distance": dist[destination], "path": path}
