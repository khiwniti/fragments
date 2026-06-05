'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { KGStats } from '@/components/kg/kg-stats'
import { KGSearch } from '@/components/kg/kg-search'
import { KGSkills } from '@/components/kg/kg-skills'
import { KGProjects } from '@/components/kg/kg-projects'
import { Network, Search, Cpu, Boxes } from 'lucide-react'

export function KGExplorer() {
  const [tab, setTab] = useState('overview')

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList className="flex flex-wrap gap-1 h-auto">
        <TabsTrigger value="overview" className="gap-1">
          <Network className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="search" className="gap-1">
          <Search className="h-4 w-4" />
          Search
        </TabsTrigger>
        <TabsTrigger value="skills" className="gap-1">
          <Cpu className="h-4 w-4" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="projects" className="gap-1">
          <Boxes className="h-4 w-4" />
          Projects
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <KGStats />
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Top Skills</h2>
            <KGSkills />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <KGProjects />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="search" className="space-y-6">
        <KGSearch />
      </TabsContent>

      <TabsContent value="skills" className="space-y-6">
        <KGSkills />
      </TabsContent>

      <TabsContent value="projects" className="space-y-6">
        <KGProjects />
      </TabsContent>
    </Tabs>
  )
}
