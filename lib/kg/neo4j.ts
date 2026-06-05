import neo4j, { Driver, Session } from 'neo4j-driver'

const URI = process.env.NEO4J_URI || ''
const USER = process.env.NEO4J_USER || ''
const PASSWORD = process.env.NEO4J_PASSWORD || ''

let _driver: Driver | null = null

export function getDriver(): Driver {
  if (!_driver) {
    if (!URI || !USER || !PASSWORD) {
      throw new Error(
        'Neo4j credentials missing. Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env.local'
      )
    }
    _driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 30000,
    })
  }
  return _driver
}

export async function runCypher<T = unknown>(
  cypher: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const driver = getDriver()
  const session: Session = driver.session()
  try {
    const result = await session.run(cypher, params)
    return result.records.map((record) => record.toObject() as T)
  } finally {
    await session.close()
  }
}

export async function runCypherSingle<T = unknown>(
  cypher: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const rows = await runCypher<T>(cypher, params)
  return rows[0] ?? null
}

export async function verifyConnectivity(): Promise<{ ok: boolean; message: string }> {
  try {
    const driver = getDriver()
    await driver.verifyConnectivity()
    return { ok: true, message: 'Connected to Neo4j Aura' }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Unknown Neo4j error',
    }
  }
}

export function closeDriver(): void {
  if (_driver) {
    _driver.close()
    _driver = null
  }
}
