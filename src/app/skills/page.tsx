'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BarChart3, Plus, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

export default function SkillsPage() {
  const [skills, setSkills] = useState([
    {
      id: '1',
      name: 'React',
      category: '前端',
      level: 85,
      lastUpdated: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'TypeScript',
      category: '前端',
      level: 80,
      lastUpdated: new Date('2024-01-14'),
    },
    {
      id: '3',
      name: 'JavaScript',
      category: '前端',
      level: 90,
      lastUpdated: new Date('2024-01-10'),
    },
    {
      id: '4',
      name: 'HTML/CSS',
      category: '前端',
      level: 85,
      lastUpdated: new Date('2024-01-08'),
    },
    {
      id: '5',
      name: 'Node.js',
      category: '后端',
      level: 75,
      lastUpdated: new Date('2024-01-05'),
    },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [newSkill, setNewSkill] = useState<{
    name: string
    category: string
    level: number
  }>({
    name: '',
    category: '前端',
    level: 50,
  })

  const categories = ['前端', '后端', '数据库', 'DevOps', '其他']

  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      const skill = {
        id: Date.now().toString(),
        name: newSkill.name,
        category: newSkill.category,
        level: newSkill.level,
        lastUpdated: new Date(),
      }
      setSkills([...skills, skill])
      setNewSkill({ name: '', category: '前端', level: 50 })
      setIsEditing(false)
    }
  }

  const handleDeleteSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id))
  }

  const getLevelColor = (level: number) => {
    if (level >= 80) return 'bg-green-500'
    if (level >= 60) return 'bg-blue-500'
    if (level >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getLevelText = (level: number) => {
    if (level >= 80) return '精通'
    if (level >= 60) return '熟练'
    if (level >= 40) return '一般'
    return '入门'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">技能管理</h1>
        <p className="text-gray-600">管理和跟踪你的技术技能水平</p>
      </div>

      {/* 添加技能按钮 */}
      <div className="mb-8">
        <Button 
          onClick={() =>setIsEditing(!isEditing)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isEditing ? '取消' : '添加技能'}
        </Button>
      </div>

      {/* 添加技能表单 */}
      {isEditing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>添加新技能</CardTitle>
            <CardDescription>填写技能名称和评估你的熟练程度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">技能名称</label>
              <Input
                placeholder="例如：React, TypeScript, Java"
                value={newSkill.name}
                onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">技能分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={newSkill.category === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewSkill({...newSkill, category})}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">熟练程度</label>
                <span className="text-sm text-gray-500">{newSkill.level}%</span>
              </div>
              <Slider
                value={[newSkill.level] as number[]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) => setNewSkill({...newSkill, level: value[0]})}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>入门</span>
                <span>一般</span>
                <span>熟练</span>
                <span>精通</span>
              </div>
            </div>

            <Button 
              onClick={handleAddSkill}
              className="w-full"
            >
              添加技能
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 技能列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <Card key={skill.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <CardDescription>{skill.category} • {getLevelText(skill.level)}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() =>handleDeleteSkill(skill.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">熟练度</span>
                  <span className="font-medium">{skill.level}%</span>
                </div>
                <Progress 
                  value={skill.level} 
                  className="h-2"
                  style={{
                    '--tw-progress-fill': skill.level >= 80 ? '#10b981' : 
                                        skill.level >= 60 ? '#3b82f6' : 
                                        skill.level >= 40 ? '#f59e0b' : '#ef4444'
                  } as React.CSSProperties}
                />
              </div>
              <div className="mt-4 text-xs text-gray-500">
                最后更新: {skill.lastUpdated.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 技能统计 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>技能统计</CardTitle>
          <CardDescription>你的技能分布情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{skills.length}</div>
              <div className="text-sm text-gray-500">技能总数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length)}%
              </div>
              <div className="text-sm text-gray-500">平均水平</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {skills.filter(s => s.level >= 80).length}
              </div>
              <div className="text-sm text-gray-500">精通技能</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {skills.filter(s => s.level >= 60 && s.level < 80).length}
              </div>
              <div className="text-sm text-gray-500">熟练技能</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}