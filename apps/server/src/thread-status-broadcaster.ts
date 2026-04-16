type ThreadStatus = "running" | "idle";

type ThreadStatusEvent = { threadId: string; status: ThreadStatus };

type Subscriber = (event: ThreadStatusEvent) => void;

class ThreadStatusBroadcaster {
  private subscribers = new Set<Subscriber>();

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  broadcast(threadId: string, status: ThreadStatus) {
    for (const fn of this.subscribers) {
      try {
        fn({ threadId, status });
      } catch {}
    }
  }
}

export const threadStatusBroadcaster = new ThreadStatusBroadcaster();
