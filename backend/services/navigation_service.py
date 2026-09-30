from database.models import HospitalNode, HospitalEdge
from algorithms.dijkstra import shortest_path


def build_graph():
    """Build an adjacency-dict graph from the HospitalNode/HospitalEdge tables."""
    nodes = {n.id: n.name for n in HospitalNode.query.all()}
    graph = {name: {} for name in nodes.values()}
    for e in HospitalEdge.query.all():
        src, dst = nodes.get(e.source_node_id), nodes.get(e.destination_node_id)
        if src and dst:
            graph[src][dst] = {
                "distance": e.distance,
                "stairs": e.has_stairs,
                "wheelchair_accessible": e.wheelchair_accessible,
                "elevator": e.is_elevator,
            }
    return graph


def find_route(source: str, destination: str, mode: str = "normal"):
    graph = build_graph()
    return shortest_path(graph, source, destination, mode)
