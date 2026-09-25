# People

> Status: stable
> Owner: Malcolm (lead)
> Last meaningful update: 2026-09-25

Groups change, so **this table is the only place current group membership is kept.**
Personal logs don't record your group in their header. Each entry is tagged with the
group the work was for at the time.

| Name | GitHub | Current group | Personal log |
|---|---|---|---|
| Malcolm Ovin | [@salon64](https://github.com/salon64) | Lead (all groups) | [malcolm-ovin.md](malcolm-ovin.md) |
| Nahor Tsegay | [@Dispatch7478](https://github.com/Dispatch7478) | G1 | [nahor-tsegay.md](nahor-tsegay.md) |
| Viggo Härdelin | [@K4ffeMan](https://github.com/K4ffeMan) | G1 | [viggo-hardelin.md](viggo-hardelin.md) |
| Alazar Belay | [@a-l-a-z-a-r](https://github.com/a-l-a-z-a-r) | G1 | [alazar-belay.md](alazar-belay.md) |
| Rasmus Kebert | [@Kebertr](https://github.com/Kebertr) | G2 | [rasmus-kebert.md](rasmus-kebert.md) |
| Sebastian Pettersson | [@SebPet-00](https://github.com/SebPet-00) | G2 | [sebastian-pettersson.md](sebastian-pettersson.md) |
| Erik Helgesson | [@Ehel00](https://github.com/Ehel00) | G2 | [erik-helgesson.md](erik-helgesson.md) |
| Alex Burman | [@Burmaaan](https://github.com/Burmaaan) | G3 | [alex-burman.md](alex-burman.md) |
| Noy Nyström | [@nonkan](https://github.com/nonkan) | G3 | [noy-nystrom.md](noy-nystrom.md) |
| Samuel Österberg | [@on-gadha](https://github.com/on-gadha) | G3 | [samuel-osterberg.md](samuel-osterberg.md) |

When someone changes group: update the table above, and add an entry to their
personal log (`2026-10-12 — G2 — Moved from G1 to G2.`).

## Personal activity logs

[The group log](../README.md#activity-log) is for everyone: milestones, decisions,
anything another person needs to know. It has **no names or titles**, so who did
what is recorded only here. Your personal log is what *you* did: work
sessions, reading, experiments, fixes. It's the record of your individual
contribution. Anything that affects others still goes in the group log (see
[CONTRIBUTING.md](../CONTRIBUTING.md) rule 5). The personal log doesn't replace it.

Entry format, newest first, one line:

```
- YYYY-MM-DD — [G1|G2|G3|ALL] — what you did. → [doc](../path/to/doc.md) ⇡ [<group-entry-id>](../README.md#<group-entry-id>)
```

- No `who`: the file already says who.
- `→ link` points to the document holding the detail (optional, same as the group log).
- `⇡ link` is **optional** and **explicit**: add it only when this work is part of a
  specific group log entry. The link text is the entry's id, and the target is
  `../README.md#<id>`. Not all of a group's work concerns everyone in it, so it is
  never inferred.

### Linking to a group entry

Every group log entry starts with an anchor: `<a id="YYYY-MM-DD-slug"></a>`. The slug
is 2–4 lowercase-hyphenated words about the entry, e.g. `2026-09-24-delivery-repo`.
Ids are unique and never change once written.

If the group entry you want doesn't exist yet, add it to the group log first (with its
anchor), then link to it.

### Example

Group log (`README.md`):
```
- <a id="2026-10-02-telemetry-schema"></a>2026-10-02 — ALL — Agreed the MQTT payload schema G1 sends to iCAP. → [ic-01](interfaces/ic-01-telemetry.md)
```

Nahor's log (`people/nahor-tsegay.md`):
```
- 2026-10-01 — G1 — Drafted the payload schema from the sensor I/O map. → [ic-01](../interfaces/ic-01-telemetry.md) ⇡ [2026-10-02-telemetry-schema](../README.md#2026-10-02-telemetry-schema)
- 2026-09-30 — G1 — Read the IEC 61499 intro, notes added. → [reading-list](../references/reading-list.md)
```
